import { DurableObject } from 'cloudflare:workers'
import type { Context } from 'hono'
import { sha256Hex } from './crypto'

// In-site learning helper: a small chat that answers chess-learning questions.
// Runs on Cloudflare Workers AI (free allocation only). It never logs message text,
// keeps only daily-salted hashed counters inside a small SQLite-backed Durable Object (free plan, no D1 tables), and degrades to a friendly message when
// the per-user, per-minute or per-site daily budget is used up (or the account quota returns 429).

export type Role = 'user' | 'assistant'
export interface ChatMsg {
  role: Role
  content: string
}

export const DEFAULT_MODEL = '@cf/google/gemma-3-12b-it'
// Pricing page (Nov 2026): gemma-3-12b-it = 31371 neurons per M input tokens, 50560 per M output tokens.
const IN_RATE = 31371 / 1e6
const OUT_RATE = 50560 / 1e6

const MAX_MESSAGES = 6
const MAX_CHARS = 600
const MAX_OUT_TOKENS = 320

export const LIMITS = {
  userDaily: 15,
  userPerMinute: 4,
  /** The account's free allocation (10,000 neurons/day) is shared by every site, so each site keeps a small slice. */
  siteDailyNeurons: 2500,
  /** Worst-case cost of one call, reserved before calling the model. */
  reserveNeurons: 40,
}

const MSG = {
  eg: {
    quota: 'المساعد خلّص حصته النهاردة. جرّب تاني بكرة، ولحد وقتها الدروس والألغاز مفتوحة.',
    rate: 'استنى دقيقة وجرّب تاني.',
    user: 'وصلت للحد اليومي من الأسئلة. كمّل بكرة، والدروس والألغاز شغالة.',
    down: 'المساعد مش متاح دلوقتي. جرّب كمان شوية.',
    bad: 'اكتب سؤالك عن الشطرنج وابعته.',
  },
  en: {
    quota: "The helper has used up today's allowance. Try again tomorrow; lessons and puzzles stay open meanwhile.",
    rate: 'Give it a minute and try again.',
    user: "You've reached today's question limit. Come back tomorrow; lessons and puzzles still work.",
    down: 'The helper is not available right now. Please try again shortly.',
    bad: 'Type a chess question and send it.',
  },
}

export function systemPrompt(locale: 'eg' | 'en'): string {
  const lang =
    locale === 'en'
      ? 'Answer in simple, friendly English.'
      : 'جاوب بالعامية المصرية البسيطة، بأرقام إنجليزي (1، 2، 3)، وبنبرة ودودة. استخدم مصطلحات الشطرنج بالعربي زي كش، كش مات، تبييت، شوكة، تثبيت، وحط الاسم الإنجليزي بين قوسين لو مهم.'
  return [
    'You are the learning helper inside Chesti, a free site that teaches chess to Arabic speakers (lessons, puzzles, openings, traps, endgames, an encyclopedia).',
    'Only help with learning chess: rules, tactics, openings, endgames, strategy, notation, how to improve, and how to use the site.',
    'If the question is about something else, say politely in one sentence that you only help with chess, and offer a chess topic.',
    'Be accurate. If you are not sure about a move, a variation or a fact, say so instead of guessing. Never invent games, players, ratings or statistics.',
    'Do not claim to be a person. Do not mention models, providers or technology. Call yourself "the helper".',
    'Keep answers short: at most 120 words. Use short paragraphs or a short list. No emoji. Do not use markdown headings.',
    'Do not ask for or store personal information.',
    lang,
  ].join('\n')
}

export function cleanMessages(input: unknown): ChatMsg[] | null {
  if (!Array.isArray(input)) return null
  const out: ChatMsg[] = []
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const text = content.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS)
    if (text) out.push({ role, content: text })
  }
  if (!out.length || out[out.length - 1].role !== 'user') return null
  return out
}

export function estimateNeurons(promptChars: number, outChars: number, usage?: { prompt_tokens?: number; completion_tokens?: number }): number {
  const inTok = usage?.prompt_tokens ?? Math.ceil(promptChars / 3)
  const outTok = usage?.completion_tokens ?? Math.ceil(outChars / 3)
  return Math.max(1, Math.ceil(inTok * IN_RATE + outTok * OUT_RATE))
}

type AiBinding = { run(model: string, input: unknown): Promise<unknown> }
export type Verdict = 'ok' | 'quota' | 'rate' | 'user_limit'
export interface LimiterApi {
  check(key: string, day: string, minute: string): Promise<Verdict>
  record(key: string, day: string, minute: string, neurons: number): Promise<void>
}
type HelperEnv = { DB: D1Database; AI?: AiBinding; AI_MODEL?: string; HELPER_LIMITER?: DurableObjectNamespace<HelperLimiter>; HELPER_SCOPE?: string }

/**
 * One instance serves the whole site, so every check and update is serialized (no races).
 * Rows: (bucket, key) with a day or minute bucket, key 'site' or a hashed visitor id.
 */
export class HelperLimiter extends DurableObject implements LimiterApi {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as never)
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS usage (bucket TEXT NOT NULL, key TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, neurons INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (bucket, key))')
  }

  private row(bucket: string, key: string): { calls: number; neurons: number } {
    const r = this.ctx.storage.sql.exec('SELECT calls, neurons FROM usage WHERE bucket = ? AND key = ?', bucket, key).toArray()[0] as { calls: number; neurons: number } | undefined
    return r ?? { calls: 0, neurons: 0 }
  }

  async check(key: string, day: string, minute: string): Promise<Verdict> {
    if (this.row(day, 'site').neurons + LIMITS.reserveNeurons > LIMITS.siteDailyNeurons) return 'quota'
    if (this.row(minute, key).calls >= LIMITS.userPerMinute) return 'rate'
    if (this.row(day, key).calls >= LIMITS.userDaily) return 'user_limit'
    return 'ok'
  }

  async record(key: string, day: string, minute: string, neurons: number): Promise<void> {
    const sql = this.ctx.storage.sql
    const bump = (bucket: string, k: string, n: number) =>
      sql.exec('INSERT INTO usage (bucket, key, calls, neurons) VALUES (?, ?, 1, ?) ON CONFLICT(bucket, key) DO UPDATE SET calls = calls + 1, neurons = neurons + excluded.neurons', bucket, k, n)
    bump(day, 'site', neurons)
    if (key) {
      bump(day, key, neurons)
      bump(minute, key, neurons)
    }
    // housekeeping: counters older than 2 days are useless ('YYYY-MM-DD' sorts before newer buckets)
    sql.exec('DELETE FROM usage WHERE bucket < ?', new Date(Date.parse(day) - 2 * 86_400_000).toISOString().slice(0, 10))
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const isoMinute = (d: Date) => d.toISOString().slice(0, 16)

async function userKey(c: Context, env: HelperEnv, day: string): Promise<string> {
  const m = /^Bearer (.+)$/.exec(c.req.header('Authorization') ?? '')
  let who = ''
  if (m) {
    const row = await env.DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
      .bind(await sha256Hex(m[1]), new Date().toISOString())
      .first<{ user_id: number }>()
    if (row) who = `acct:${row.user_id}`
  }
  if (!who) who = `ip:${c.req.header('CF-Connecting-IP') ?? 'local'}`
  return `u:${(await sha256Hex(`${who}|${day}|chesti-helper`)).slice(0, 24)}`
}

export async function handleHelper(c: Context, env: HelperEnv, body: Record<string, unknown>): Promise<Response> {
  const locale = body.locale === 'en' ? 'en' : 'eg'
  const t = MSG[locale]
  const messages = cleanMessages(body.messages)
  if (!messages) return c.json({ error: 'bad_request', message: t.bad }, 400)
  if (!env.AI) return c.json({ error: 'unavailable', message: t.down }, 503)

  const now = new Date()
  const day = isoDay(now)
  const minute = isoMinute(now)
  const key = await userKey(c, env, day)

  // Fail closed: without a working limiter we do not call the model at all.
  let limiter: LimiterApi
  let verdict: Verdict
  try {
    if (!env.HELPER_LIMITER) throw new Error('no limiter')
    limiter = env.HELPER_LIMITER.get(env.HELPER_LIMITER.idFromName(env.HELPER_SCOPE || 'site')) as unknown as LimiterApi
    verdict = await limiter.check(key, day, minute)
  } catch {
    return c.json({ error: 'unavailable', message: t.down }, 503)
  }
  if (verdict === 'quota') return c.json({ error: 'quota', message: t.quota }, 429)
  if (verdict === 'rate') return c.json({ error: 'rate', message: t.rate }, 429)
  if (verdict === 'user_limit') return c.json({ error: 'user_limit', message: t.user }, 429)

  const prompt = [{ role: 'system', content: systemPrompt(locale) }, ...messages]
  const promptChars = prompt.reduce((n, m) => n + m.content.length, 0)

  let reply = ''
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined
  try {
    const out = (await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, { messages: prompt, max_tokens: MAX_OUT_TOKENS, temperature: 0.3 })) as {
      response?: unknown
      choices?: { message?: { content?: unknown } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const r = out?.response ?? out?.choices?.[0]?.message?.content
    reply = typeof r === 'string' ? r.trim() : ''
    usage = out?.usage
  } catch (e) {
    const text = String((e as Error)?.message ?? e)
    // 3036 = the account's free Neurons are used up for the day (shared by all sites)
    if (/3036|neurons|quota|429/i.test(text)) {
      await limiter.record('', day, minute, LIMITS.siteDailyNeurons).catch(() => {}) // stop trying for the rest of the day
      return c.json({ error: 'quota', message: t.quota }, 429)
    }
    return c.json({ error: 'unavailable', message: t.down }, 503)
  }
  if (!reply) return c.json({ error: 'unavailable', message: t.down }, 503)

  const spent = estimateNeurons(promptChars, reply.length, usage)
  await limiter.record(key, day, minute, spent).catch(() => {})
  return c.json({ reply: reply.slice(0, 1500) })
}
