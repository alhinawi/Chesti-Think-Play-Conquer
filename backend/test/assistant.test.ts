import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import app from '../src/index'
import { cleanMessages, estimateNeurons, LIMITS, reserveCost, systemPrompt, type LimiterApi } from '../src/assistant'

const ask = (e: unknown, body: unknown, ip = '1.1.1.1') =>
  app.request(
    '/api/assistant',
    { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) },
    e as typeof env,
  )

const day = () => new Date().toISOString().slice(0, 10)
const minute = () => new Date().toISOString().slice(0, 16)
let scope = ''
const base = () => ({ DB: env.DB, ALLOWED_ORIGINS: env.ALLOWED_ORIGINS, HELPER_LIMITER: env.HELPER_LIMITER, HELPER_SCOPE: scope })
const limiter = () => env.HELPER_LIMITER!.get(env.HELPER_LIMITER!.idFromName(scope)) as unknown as LimiterApi

const ok = (calls: { n: number }) => ({
  ...base(),
  AI: {
    run: async () => {
      calls.n++
      return { response: 'الفيل بيمشي قطري.', usage: { prompt_tokens: 200, completion_tokens: 30 } }
    },
  },
})

const q = (text: string) => ({ locale: 'eg', messages: [{ role: 'user', content: text }] })

let n = 0
beforeEach(() => {
  scope = `test-${++n}`
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
    expect(estimateNeurons(0, 0, { prompt_tokens: 1000, completion_tokens: 100 })).toBe(Math.ceil(1000 * 0.009091 + 100 * 0.027273))
    expect(estimateNeurons(900, 300)).toBeGreaterThan(0)
  })
  it('reserves more than a realistic worst case and never less than the settled cost', () => {
    expect(reserveCost(5000)).toBeGreaterThanOrEqual(estimateNeurons(5000, 320 * 3, { prompt_tokens: 2500, completion_tokens: 320 }))
    expect(reserveCost(1500)).toBeLessThan(LIMITS.siteDailyNeurons / 50)
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
    // the reservation was settled down to the real cost (about 3 neurons), so almost the whole budget is still free
    expect(await limiter().reserve('u:probe', day(), minute(), LIMITS.siteDailyNeurons - 8)).toBe('ok')
  })

  it('answers in English when asked to', async () => {
    const res = await ask(base(), { locale: 'en', messages: [{ role: 'user', content: 'hi' }] })
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
    for (let i = 0; i < LIMITS.userDaily; i++) expect(await limiter().reserve('u:me', day(), `${day()}T00:${String(i).padStart(2, '0')}`, 5)).toBe('ok')
    expect(await limiter().reserve('u:me', day(), `${day()}T09:59`, 5)).toBe('user_limit')
    expect(await limiter().reserve('u:other', day(), `${day()}T09:59`, 5)).toBe('ok')
  })

  it('stops for everyone when the site budget is used, without calling the model', async () => {
    const calls = { n: 0 }
    await limiter().reserve('', day(), `${day()}T00:00`, LIMITS.siteDailyNeurons)
    const res = await ask(ok(calls), q('سؤال'))
    expect(res.status).toBe(429)
    const j = (await res.json()) as { error: string; message: string }
    expect(j.error).toBe('quota')
    expect(j.message).toMatch(/بكرة/)
    expect(calls.n).toBe(0)
  })

  it('reserves atomically: concurrent requests cannot exceed the per-minute limit', async () => {
    const calls = { n: 0 }
    const e = ok(calls)
    const results = await Promise.all(Array.from({ length: 12 }, () => ask(e, q('سؤال'))))
    expect(results.filter((r) => r.status === 200)).toHaveLength(LIMITS.userPerMinute)
    expect(results.filter((r) => r.status === 429)).toHaveLength(12 - LIMITS.userPerMinute)
    expect(calls.n).toBe(LIMITS.userPerMinute)
  })

  it('reserves atomically against the site budget', async () => {
    const verdicts = await Promise.all(Array.from({ length: 8 }, (_, i) => limiter().reserve(`u:${i}`, day(), minute(), 1000)))
    expect(verdicts.filter((v) => v === 'ok')).toHaveLength(2) // 2 x 1000 fits in 2500, the third does not
    expect(verdicts.filter((v) => v === 'quota')).toHaveLength(6)
  })

  it('gives the reservation back when the model fails, so failures do not eat the allowance', async () => {
    const dead = { ...base(), AI: { run: async () => { throw new Error('boom') } } }
    for (let i = 0; i < LIMITS.userPerMinute + 2; i++) expect((await ask(dead, q('سؤال'))).status).toBe(503)
    const calls = { n: 0 }
    expect((await ask(ok(calls), q('سؤال'))).status).toBe(200)
    expect(calls.n).toBe(1)
  })

  it('turns the account quota error (3036) into the friendly message and pauses for the day', async () => {
    const boom = { ...base(), AI: { run: async () => { throw new Error('3036: you have used up your daily free allocation of 10,000 neurons') } } }
    const res = await ask(boom, q('سؤال'))
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe('quota')
    const again = await ask(ok({ n: 0 }), q('سؤال'), '3.3.3.3')
    expect(((await again.json()) as { error: string }).error).toBe('quota')
  })

  it('returns a friendly 503 when the model fails or answers with nothing', async () => {
    const dead = { ...base(), AI: { run: async () => { throw new Error('boom') } } }
    expect((await ask(dead, q('سؤال'))).status).toBe(503)
    const empty = { ...base(), AI: { run: async () => ({ response: '' }) } }
    expect((await ask(empty, q('سؤال'))).status).toBe(503)
  })

  it('fails closed when the limiter is missing: no model call', async () => {
    const calls = { n: 0 }
    const e = { ...ok(calls), HELPER_LIMITER: undefined }
    const res = await ask(e, q('سؤال'))
    expect(res.status).toBe(503)
    expect(calls.n).toBe(0)
  })

  it('fails closed when the limiter throws', async () => {
    const calls = { n: 0 }
    const broken = { idFromName: () => 'x', get: () => ({ check: async () => { throw new Error('down') }, record: async () => {} }) }
    const res = await ask({ ...ok(calls), HELPER_LIMITER: broken }, q('سؤال'))
    expect(res.status).toBe(503)
    expect(calls.n).toBe(0)
  })

  it('reads the chat-completions reply shape (choices) and passes the documented parameters', async () => {
    let seen: { model: string; input: Record<string, unknown> } | undefined
    const e = {
      ...base(),
      AI: {
        run: async (model: string, input: Record<string, unknown>) => {
          seen = { model, input }
          return { choices: [{ message: { content: [{ type: 'text', text: 'الفيل ' }, { type: 'text', text: 'قطري.' }] }, finish_reason: 'stop' }], usage: { prompt_tokens: 300, completion_tokens: 40 } }
        },
      },
    }
    const res = await ask(e, q('سؤال'))
    expect(res.status).toBe(200)
    expect(((await res.json()) as { reply: string }).reply).toBe('الفيل قطري.')
    expect(seen!.model).toBe('@cf/google/gemma-4-26b-a4b-it')
    expect(Array.isArray(seen!.input.messages)).toBe(true)
    expect(seen!.input.max_completion_tokens).toBe(700)
    expect(seen!.input.chat_template_kwargs).toEqual({ enable_thinking: false })
  })

  it('reports a safe reason code for each failure, without user text', async () => {
    const secret = 'سؤال-سري-123'
    const get = async (e: unknown) => (await (await ask(e, q(secret))).json()) as { reason?: string; message: string; error?: string }
    expect((await get({ ...ok({ n: 0 }), HELPER_LIMITER: undefined })).reason).toBe('no_limiter_binding')
    expect((await get({ ...base() })).reason).toBe('no_ai_binding')
    const broken = { idFromName: () => 'x', get: () => ({ reserve: async () => { throw new Error('do exploded') } }) }
    const r1 = await get({ ...ok({ n: 0 }), HELPER_LIMITER: broken })
    expect(r1.reason).toBe('reserve_failed')
    const r2 = await get({ ...base(), AI: { run: async () => { throw new Error('InferenceUpstreamError: bad model') } } })
    expect(r2.reason).toBe('model_error')
    const r3 = await get({ ...base(), AI: { run: async () => ({ choices: [{ message: { content: null }, finish_reason: 'length' }], usage: { prompt_tokens: 100, completion_tokens: 700 } }) } })
    expect(r3.reason).toBe('empty_reply')
    expect(JSON.stringify([r1, r2, r3])).not.toContain(secret)
  })

  it('keeps an empty reply counted at its real cost (no quota burn by retries)', async () => {
    const empty = { ...base(), AI: { run: async () => ({ choices: [{ message: { content: null }, finish_reason: 'length' }], usage: { prompt_tokens: 100, completion_tokens: 700 } }) } }
    for (let i = 0; i < LIMITS.userPerMinute; i++) expect((await ask(empty, q('سؤال'))).status).toBe(503)
    expect((await ask(empty, q('سؤال'))).status).toBe(429) // still rate-limited: the calls were counted
  })
})
