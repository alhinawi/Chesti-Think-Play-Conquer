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

export const DEFAULT_MODEL = '@cf/google/gemma-4-26b-a4b-it'
// Pricing page (Nov 2026): gemma-4-26b-a4b-it = 9091 neurons per M input tokens, 27273 per M output tokens.
// (gemma-3-12b-it was retired on 2026-05-30.)
const IN_RATE = 9091 / 1e6
const OUT_RATE = 27273 / 1e6

const MAX_MESSAGES = 6
const MAX_CHARS = 600
// Gemma 4 is a reasoning model: thinking tokens count against this cap, so leave room for the visible answer.
const MAX_OUT_TOKENS = 700

/** Conservative cost of one call, reserved before the model runs (assumes 2 characters per token). */
export function reserveCost(promptChars: number): number {
  return Math.ceil((promptChars / 2) * IN_RATE + MAX_OUT_TOKENS * OUT_RATE) + 1
}

export const LIMITS = {
  userDaily: 15,
  userPerMinute: 4,
  /** The account's free allocation (10,000 neurons/day) is shared by every site, so each site keeps a small slice. */
  siteDailyNeurons: 2500,
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
  /** Atomically checks the limits and, if all pass, reserves one call and `cost` neurons. */
  reserve(key: string, day: string, minute: string, cost: number): Promise<Verdict>
  /** After the model answered: replace the reserved cost with the actual one (the call stays counted). */
  settle(key: string, day: string, minute: string, reserved: number, actual: number): Promise<void>
  /** The model did not run or failed: give the reservation back. */
  refund(key: string, day: string, minute: string, reserved: number): Promise<void>
  /** The account quota is gone: stop for the rest of the day. */
  exhaust(day: string): Promise<void>
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

  async reserve(key: string, day: string, minute: string, cost: number): Promise<Verdict> {
    // One Durable Object instance runs these statements one request at a time, so the
    // check and the reservation below cannot interleave with another request.
    if (this.row(day, 'site').neurons + cost > LIMITS.siteDailyNeurons) return 'quota'
    if (this.row(minute, key).calls >= LIMITS.userPerMinute) return 'rate'
    if (this.row(day, key).calls >= LIMITS.userDaily) return 'user_limit'
    this.add(day, 'site', 1, cost)
    this.add(day, key, 1, cost)
    this.add(minute, key, 1, cost)
    this.ctx.storage.sql.exec('DELETE FROM usage WHERE bucket < ?', new Date(Date.parse(day) - 2 * 86_400_000).toISOString().slice(0, 10))
    return 'ok'
  }

  async settle(key: string, day: string, minute: string, reserved: number, actual: number): Promise<void> {
    const d = actual - reserved
    this.add(day, 'site', 0, d)
    this.add(day, key, 0, d)
    this.add(minute, key, 0, d)
  }

  async refund(key: string, day: string, minute: string, reserved: number): Promise<void> {
    this.add(day, 'site', -1, -reserved)
    this.add(day, key, -1, -reserved)
    this.add(minute, key, -1, -reserved)
  }

  async exhaust(day: string): Promise<void> {
    this.add(day, 'site', 0, LIMITS.siteDailyNeurons)
  }

  private add(bucket: string, key: string, calls: number, neurons: number): void {
    const sql = this.ctx.storage.sql
    sql.exec('INSERT OR IGNORE INTO usage (bucket, key, calls, neurons) VALUES (?, ?, 0, 0)', bucket, key)
    sql.exec('UPDATE usage SET calls = MAX(0, calls + ?), neurons = MAX(0, neurons + ?) WHERE bucket = ? AND key = ?', calls, neurons, bucket, key)
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const isoMinute = (d: Date) => d.toISOString().slice(0, 16)

async function userKey(c: Context, env: HelperEnv, day: string): Promise<string> {
  const m = /^Bearer (.+)$/.exec(c.req.header('Authorization') ?? '')
  let who = ''
  if (m) {
    try {
      const row = await env.DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
        .bind(await sha256Hex(m[1]), new Date().toISOString())
        .first<{ user_id: number }>()
      if (row) who = `acct:${row.user_id}`
    } catch {
      // fall back to the per-IP key
    }
  }
  if (!who) who = `ip:${c.req.header('CF-Connecting-IP') ?? 'local'}`
  return `u:${(await sha256Hex(`${who}|${day}|chesti-helper`)).slice(0, 24)}`
}

export type Reason = 'bad_request' | 'no_ai_binding' | 'no_limiter_binding' | 'reserve_failed' | 'model_error' | 'empty_reply' | 'quota' | 'rate' | 'user_limit'

/** Non-secret diagnostics: a reason code plus the error class and a short message. Never user text. */
function diag(reason: Reason, err?: unknown) {
  const e = err as { name?: string; message?: string } | undefined
  const detail = e ? { error: String(e.name ?? 'Error').slice(0, 40), message: String(e.message ?? e).replace(/\s+/g, ' ').slice(0, 160) } : {}
  console.warn(JSON.stringify({ helper: 'fail', reason, ...detail }))
  return { reason, ...detail }
}

function replyText(out: unknown): { text: string; finish?: string } {
  const o = out as { response?: unknown; choices?: { message?: { content?: unknown }; finish_reason?: string }[] } | null
  const ch = o?.choices?.[0]
  let c: unknown = ch?.message?.content ?? o?.response
  if (Array.isArray(c)) c = c.map((p) => (typeof p === 'string' ? p : String((p as { text?: unknown })?.text ?? ''))).join('')
  return { text: typeof c === 'string' ? c.trim() : '', finish: ch?.finish_reason }
}

export async function handleHelper(c: Context, env: HelperEnv, body: Record<string, unknown>): Promise<Response> {
  const locale = body.locale === 'en' ? 'en' : 'eg'
  const t = MSG[locale]
  const messages = cleanMessages(body.messages)
  if (!messages) return c.json({ error: 'bad_request', reason: 'bad_request', message: t.bad }, 400)
  if (!env.AI) return c.json({ error: 'unavailable', ...diag('no_ai_binding'), message: t.down }, 503)

  const now = new Date()
  const day = isoDay(now)
  const minute = isoMinute(now)
  const key = await userKey(c, env, day)
  const prompt = [{ role: 'system', content: systemPrompt(locale) }, ...messages]
  const promptChars = prompt.reduce((n, m) => n + m.content.length, 0)
  const cost = reserveCost(promptChars)

  // Atomic reservation before the model runs. Fail closed: without a working limiter
  // (binding missing, Durable Object error) the model is never called.
  let limiter: LimiterApi
  let verdict: Verdict
  try {
    if (!env.HELPER_LIMITER) return c.json({ error: 'unavailable', ...diag('no_limiter_binding'), message: t.down }, 503)
    limiter = env.HELPER_LIMITER.get(env.HELPER_LIMITER.idFromName(env.HELPER_SCOPE || 'site')) as unknown as LimiterApi
    verdict = await limiter.reserve(key, day, minute, cost)
  } catch (e) {
    return c.json({ error: 'unavailable', ...diag('reserve_failed', e), message: t.down }, 503)
  }
  if (verdict === 'quota') return c.json({ error: 'quota', reason: 'quota', message: t.quota }, 429)
  if (verdict === 'rate') return c.json({ error: 'rate', reason: 'rate', message: t.rate }, 429)
  if (verdict === 'user_limit') return c.json({ error: 'user_limit', reason: 'user_limit', message: t.user }, 429)

  // From here on the reservation stays counted unless we can prove the model did not answer.
  const giveBack = () => limiter.refund(key, day, minute, cost).catch(() => {})
  let reply = ''
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined
  try {
    const out = (await env.AI.run(env.AI_MODEL || DEFAULT_MODEL, {
      messages: prompt,
      max_completion_tokens: MAX_OUT_TOKENS,
      temperature: 0.3,
      chat_template_kwargs: { enable_thinking: false },
    })) as { usage?: { prompt_tokens?: number; completion_tokens?: number } }
    const r = replyText(out)
    reply = r.text
    usage = out?.usage
    if (!reply) {
      // The model ran (and may have spent its tokens on thinking): keep the call counted at its real cost.
      await limiter.settle(key, day, minute, cost, estimateNeurons(promptChars, 0, usage)).catch(() => {})
      return c.json({ error: 'unavailable', ...diag('empty_reply', new Error(`finish_reason=${r.finish ?? 'none'}`)), message: t.down }, 503)
    }
  } catch (e) {
    const text = String((e as Error)?.message ?? e)
    // 3036 = the account's free Neurons are used up for the day (shared by all sites)
    if (/3036|neurons|quota|429/i.test(text)) {
      await giveBack()
      await limiter.exhaust(day).catch(() => {}) // stop trying for the rest of the day
      return c.json({ error: 'quota', reason: 'quota', message: t.quota }, 429)
    }
    await giveBack()
    return c.json({ error: 'unavailable', ...diag('model_error', e), message: t.down }, 503)
  }

  // Replace the conservative reservation with the real cost. If this write fails the reservation stays: safe side.
  await limiter.settle(key, day, minute, cost, estimateNeurons(promptChars, reply.length, usage)).catch(() => {})
  return c.json({ reply: reply.slice(0, 1500) })
}
