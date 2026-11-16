import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import app from '../src/index'

const call = (path: string, init: { method?: string; body?: unknown; token?: string; ip?: string } = {}) =>
  app.request(
    path,
    {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...(init.ip ? { 'cf-connecting-ip': init.ip } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    },
    env,
  )

let n = 0
async function signup(device?: string, ip?: string) {
  const email = `sig${++n}@test.dev`
  const res = await call('/api/auth/register', { body: { name: 'Sig', email, password: 'secret-pass-1', device_id: device }, ip })
  const j = (await res.json()) as { token: string; user: { id: number; admin?: boolean } }
  return { email, token: j.token, id: j.user.id }
}

const flush = () => new Promise((r) => setTimeout(r, 50))

describe('account signals (multi-account anti-cheat)', () => {
  it('records hashed device + ip on register and login, never raw values', async () => {
    const u = await signup('device-aaaaaaaa-1111', '203.0.113.7')
    await flush()
    const rows = (await env.DB.prepare('SELECT kind, hash FROM account_signals WHERE user_id = ?').bind(u.id).all<{ kind: string; hash: string }>()).results
    expect(rows.map((r) => r.kind).sort()).toEqual(['device', 'ip'])
    for (const r of rows) {
      expect(r.hash).toMatch(/^[0-9a-f]{64}$/)
      expect(r.hash).not.toContain('203.0.113.7')
      expect(r.hash).not.toContain('device-aaaaaaaa-1111')
    }
    // login again with same device updates last_seen instead of duplicating
    await call('/api/auth/login', { body: { email: u.email, password: 'secret-pass-1', device_id: 'device-aaaaaaaa-1111' }, ip: '203.0.113.7' })
    await flush()
    const again = (await env.DB.prepare('SELECT COUNT(*) AS n FROM account_signals WHERE user_id = ?').bind(u.id).first<{ n: number }>())!
    expect(again.n).toBe(2)
  })

  it('links accounts sharing a device or ip (admin only)', async () => {
    const shared = await signup('device-shared-9999', '198.51.100.23')
    const other = await signup('device-shared-9999', '192.0.2.99')
    await flush()

    // non-admin is rejected
    const denied = await call('/api/admin/anticheat/links', { token: shared.token, method: 'GET' })
    expect(denied.status).toBe(403)

    // make shared user an admin (one admin email exists per test db)
    await env.DB.prepare("UPDATE users SET email = 'prev-admin@test.dev' WHERE email = '3asfuur@gmail.com'").run()
    await env.DB.prepare("UPDATE users SET email = '3asfuur@gmail.com' WHERE id = ?").bind(shared.id).run()
    const res = await call('/api/admin/anticheat/links', { token: shared.token, method: 'GET' })
    expect(res.status).toBe(200)
    const j = (await res.json()) as { links: { a: { id: number; email: string }; b: { id: number }; via: string; shared: number }[] }
    const pair = j.links.find((l) => l.a.id === shared.id && l.b.id === other.id)
    expect(pair).toBeTruthy()
    expect(pair!.via).toBe('device')
    expect(pair!.shared).toBe(1)
    expect(pair!.a.email).toContain('***')
  })

  it('builds a per-user summary with flags, abandons, hints and links', async () => {
    const u = await signup('device-summary-1', '203.0.113.55')
    await flush()
    // a finished live game, an abandoned one, a recorded game, a flag
    const g = await env.DB.prepare("INSERT INTO games (user_id, mode, opponent, color, result, moves, played_at) VALUES (?, 'computer', 'fischer', 'white', 'win', 40, strftime('%Y-%m-%dT%H:%M:%fZ','now'))").bind(u.id).run()
    await env.DB.prepare("INSERT INTO game_flags (game_id, user_id, risk_score, reasons, engine_match, engine_top3, acpl) VALUES (?, ?, 80, '[\"impossibly_fast\"]', 0.9, 0.95, 12)").bind(g.meta.last_row_id, u.id).run()
    await env.DB.prepare("INSERT INTO live_games (user_id, opponent, color, fen, status) VALUES (?, 'fischer', 'white', 'x', 'finished')").bind(u.id).run()
    await env.DB.prepare("INSERT INTO live_games (user_id, opponent, color, fen, status) VALUES (?, 'fischer', 'white', 'x', 'abandoned')").bind(u.id).run()

    await env.DB.prepare("UPDATE users SET email = 'prev-admin@test.dev' WHERE email = '3asfuur@gmail.com'").run()
    await env.DB.prepare("UPDATE users SET email = '3asfuur@gmail.com' WHERE id = ?").bind(u.id).run()
    const res = await call(`/api/admin/anticheat/users/${u.id}/summary`, { token: u.token, method: 'GET' })
    expect(res.status).toBe(200)
    const { summary: s } = (await res.json()) as { summary: Record<string, never> & {
      games: { total: number; wins: number; last7d: number }
      live: { finished: number; abandoned: number }
      flags: { total: number; open: number; analyzed: number; avgMatch: number }
      signals: { ips: number; devices: number }
      hints: string[]
    } }
    expect(s.games.total).toBe(1)
    expect(s.games.wins).toBe(1)
    expect(s.games.last7d).toBe(1)
    expect(s.live.finished).toBe(1)
    expect(s.live.abandoned).toBe(1)
    expect(s.flags.total).toBe(1)
    expect(s.flags.open).toBe(1)
    expect(s.flags.analyzed).toBe(1)
    expect(s.flags.avgMatch).toBeCloseTo(0.9)
    expect(s.signals.ips).toBeGreaterThanOrEqual(1)
    expect(s.signals.devices).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(s.hints)).toBe(true)

    expect((await call('/api/admin/anticheat/users/999999/summary', { token: u.token, method: 'GET' })).status).toBe(404)
  })
})
