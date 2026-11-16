import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import app from '../src/index'

const call = (path: string, init: { method?: string; body?: unknown; token?: string } = {}) =>
  app.request(
    path,
    {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    },
    env,
  )

let n = 0
async function signup() {
  const email = `warn${++n}@test.dev`
  const res = await call('/api/auth/register', { body: { name: 'Warn', email, password: 'secret-pass-1' } })
  const j = (await res.json()) as { token: string; user: { id: number } }
  return { email, token: j.token, id: j.user.id }
}

async function makeGame(userId: number) {
  const g = await env.DB.prepare("INSERT INTO games (user_id, mode, opponent, color, result, moves, played_at) VALUES (?, 'computer', 'fischer', 'white', 'win', 40, strftime('%Y-%m-%dT%H:%M:%fZ','now'))").bind(userId).run()
  return g.meta.last_row_id as number
}

async function makeAdmin(token2: string, id: number) {
  await env.DB.prepare("UPDATE users SET email = 'prev-admin@test.dev' WHERE email = '3asfuur@gmail.com'").run()
  await env.DB.prepare("UPDATE users SET email = '3asfuur@gmail.com' WHERE id = ?").bind(id).run()
  return token2
}

describe('cheater warnings (soft, rate-limited)', () => {
  it('auto-warns once when a game crosses the danger threshold, not below it', async () => {
    const u = await signup()
    // below-threshold flag: no warning
    const g1 = await makeGame(u.id)
    await env.DB.prepare("INSERT INTO game_flags (game_id, user_id, risk_score, reasons) VALUES (?, ?, 55, '[]')").bind(g1, u.id).run()
    // simulate what the app does at flag time
    const { maybeWarn } = await import('../src/warnings')
    expect(await maybeWarn(env.DB, u.id, g1, 55, 'auto')).toBe(false)
    // danger tier: warning created
    const g2 = await makeGame(u.id)
    expect(await maybeWarn(env.DB, u.id, g2, 85, 'auto')).toBe(true)
    // cooldown: second danger game within 7 days does not re-warn
    const g3 = await makeGame(u.id)
    expect(await maybeWarn(env.DB, u.id, g3, 90, 'auto')).toBe(false)

    const rows = (await env.DB.prepare('SELECT kind, risk_score, message FROM cheat_warnings WHERE user_id = ?').bind(u.id).all<{ kind: string; risk_score: number; message: string }>()).results
    expect(rows).toHaveLength(1)
    expect(rows[0].kind).toBe('auto')
    expect(rows[0].risk_score).toBe(85)
    expect(rows[0].message).toContain('مفيش أي إجراء')
    expect(rows[0].message).not.toContain('غشاش') // no accusation of certainty
  })

  it('admin one-tap warn: creates, then 429s inside the cooldown', async () => {
    const u = await signup()
    const admin = await signup()
    await makeAdmin(admin.token, admin.id)

    const denied = await call('/api/admin/anticheat/warn', { token: u.token, body: { user_id: u.id } })
    expect(denied.status).toBe(403)

    const ok = await call('/api/admin/anticheat/warn', { token: admin.token, body: { user_id: u.id } })
    expect(ok.status).toBe(201)
    const again = await call('/api/admin/anticheat/warn', { token: admin.token, body: { user_id: u.id } })
    expect(again.status).toBe(429)
    expect(((await again.json()) as { error: string }).error).toBe('warned_recently')

    const row = await env.DB.prepare('SELECT kind FROM cheat_warnings WHERE user_id = ?').bind(u.id).first<{ kind: string }>()
    expect(row!.kind).toBe('admin')

    expect((await call('/api/admin/anticheat/warn', { token: admin.token, body: { user_id: 999999 } })).status).toBe(404)
  })

  it('player reads and acknowledges warnings; summary lists them', async () => {
    const u = await signup()
    const admin = await signup()
    await makeAdmin(admin.token, admin.id)
    await call('/api/admin/anticheat/warn', { token: admin.token, body: { user_id: u.id } })

    expect((await call('/api/warnings', { method: 'GET' })).status).toBe(401)
    const res = await call('/api/warnings', { token: u.token, method: 'GET' })
    expect(res.status).toBe(200)
    const j = (await res.json()) as { warnings: { id: number; message: string; seen_at: string | null }[] }
    expect(j.warnings).toHaveLength(1)
    expect(j.warnings[0].seen_at).toBeNull()

    const seen = await call(`/api/warnings/${j.warnings[0].id}/seen`, { token: u.token, body: {} })
    expect(seen.status).toBe(200)
    const after = (await (await call('/api/warnings', { token: u.token, method: 'GET' })).json()) as { warnings: { seen_at: string | null }[] }
    expect(after.warnings[0].seen_at).not.toBeNull()

    // summary shows the warning log
    const sum = await call(`/api/admin/anticheat/users/${u.id}/summary`, { token: admin.token, method: 'GET' })
    const sj = (await sum.json()) as { summary: { warnings: { total: number; recent: { kind: string; seen_at: string | null }[] } } }
    expect(sj.summary.warnings.total).toBe(1)
    expect(sj.summary.warnings.recent[0].kind).toBe('admin')
    expect(sj.summary.warnings.recent[0].seen_at).not.toBeNull()

    // another user's seen call on this warning id 404s
    const other = await signup()
    expect((await call(`/api/warnings/${j.warnings[0].id}/seen`, { token: other.token, body: {} })).status).toBe(404)
  })
})
