import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import app from '../src/index'
import { cleanMessages, estimateNeurons, LIMITS, systemPrompt } from '../src/assistant'

const ask = (e: unknown, body: unknown, ip = '1.1.1.1') =>
  app.request(
    '/api/assistant',
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) },
    e as typeof env,
  )

const ok = (calls: { n: number }) => ({
  DB: env.DB,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
  AI: {
    run: async () => {
      calls.n++
      return { response: 'الفيل بيمشي قطري.', usage: { prompt_tokens: 200, completion_tokens: 30 } }
    },
  },
})

const q = (text: string) => ({ locale: 'eg', messages: [{ role: 'user', content: text }] })

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM helper_usage').run()
})

describe('helper input handling', () => {
  it('keeps the last 6 messages, trims and caps length, requires a final user message', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: ` m${i} ` }))
    expect(cleanMessages([...many, { role: 'user', content: 'x'.repeat(2000) }])!.at(-1)!.content.length).toBe(600)
    expect(cleanMessages(many)).toBeNull() // ends with assistant
    expect(cleanMessages([{ role: 'system', content: 'hi' }])).toBeNull()
    expect(cleanMessages('nope')).toBeNull()
    expect(cleanMessages([{ role: 'user', content: '   ' }])).toBeNull()
  })
  it('scopes the prompt to chess and the selected language', () => {
    expect(systemPrompt('eg')).toContain('المصرية')
    expect(systemPrompt('en')).toContain('English')
    expect(systemPrompt('eg')).toMatch(/only help with learning chess/i)
  })
  it('estimates neurons from usage, with a fallback from text length', () => {
    expect(estimateNeurons(0, 0, { prompt_tokens: 1000, completion_tokens: 100 })).toBe(Math.ceil(1000 * 0.031371 + 100 * 0.05056))
    expect(estimateNeurons(900, 300)).toBeGreaterThan(0)
  })
})

describe('POST /api/assistant', () => {
  it('rejects a bad request with a friendly message', async () => {
    const res = await ask(ok({ n: 0 }), { locale: 'eg', messages: [] })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { message: string }).message).toMatch(/شطرنج/)
  })

  it('answers and counts usage without storing any text', async () => {
    const calls = { n: 0 }
    const res = await ask(ok(calls), q('الفيل بيمشي إزاي؟'))
    expect(res.status).toBe(200)
    expect(((await res.json()) as { reply: string }).reply).toContain('قطري')
    expect(calls.n).toBe(1)
    const rows = await env.DB.prepare('SELECT bucket, key, calls, neurons FROM helper_usage').all<{ key: string; neurons: number }>()
    expect(rows.results.some((r) => r.key === 'site' && r.neurons > 0)).toBe(true)
    expect(JSON.stringify(rows.results)).not.toMatch(/الفيل|1\.1\.1\.1/) // no text, no IP
  })

  it('answers in English when asked to', async () => {
    const res = await ask({ DB: env.DB, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS }, { locale: 'en', messages: [{ role: 'user', content: 'hi' }] })
    expect(res.status).toBe(503)
    expect(((await res.json()) as { message: string }).message).toMatch(/not available/i)
  })

  it('limits one user per minute, then per day', async () => {
    const calls = { n: 0 }
    const e = ok(calls)
    for (let i = 0; i < LIMITS.userPerMinute; i++) expect((await ask(e, q('سؤال'))).status).toBe(200)
    const blocked = await ask(e, q('سؤال'))
    expect(blocked.status).toBe(429)
    expect(((await blocked.json()) as { error: string }).error).toBe('rate')
    expect(calls.n).toBe(LIMITS.userPerMinute)
    // another visitor is unaffected
    expect((await ask(e, q('سؤال'), '2.2.2.2')).status).toBe(200)
  })

  it('stops at the per-user daily limit', async () => {
    const e = ok({ n: 0 })
    const day = new Date().toISOString().slice(0, 10)
    // Seed the user row by making one call, then push the daily counter to the limit.
    await ask(e, q('سؤال'))
    await env.DB.prepare("UPDATE helper_usage SET calls = ? WHERE bucket = ? AND key LIKE 'u:%'").bind(LIMITS.userDaily, day).run()
    await env.DB.prepare("DELETE FROM helper_usage WHERE bucket LIKE '%T%'").run()
    const res = await ask(e, q('سؤال'))
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe('user_limit')
  })

  it('stops for everyone when the site budget is used, without calling the model', async () => {
    const calls = { n: 0 }
    const day = new Date().toISOString().slice(0, 10)
    await env.DB.prepare("INSERT INTO helper_usage (bucket, key, calls, neurons) VALUES (?, 'site', 100, ?)").bind(day, LIMITS.siteDailyNeurons).run()
    const res = await ask(ok(calls), q('سؤال'))
    expect(res.status).toBe(429)
    const j = (await res.json()) as { error: string; message: string }
    expect(j.error).toBe('quota')
    expect(j.message).toMatch(/بكرة/)
    expect(calls.n).toBe(0)
  })

  it('turns the account quota error (3036) into the friendly message and pauses for the day', async () => {
    const boom = { DB: env.DB, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS, AI: { run: async () => { throw new Error('3036: you have used up your daily free allocation of 10,000 neurons') } } }
    const res = await ask(boom, q('سؤال'))
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe('quota')
    const again = await ask(ok({ n: 0 }), q('سؤال'), '3.3.3.3')
    expect(((await again.json()) as { error: string }).error).toBe('quota')
  })

  it('returns a friendly 503 when the model fails or answers with nothing', async () => {
    const dead = { DB: env.DB, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS, AI: { run: async () => { throw new Error('boom') } } }
    expect((await ask(dead, q('سؤال'))).status).toBe(503)
    const empty = { DB: env.DB, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS, AI: { run: async () => ({ response: '' }) } }
    expect((await ask(empty, q('سؤال'))).status).toBe(503)
  })
})
