import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import app from '../src/index'

const call = (path: string, init: { method?: string; body?: unknown; token?: string; origin?: string } = {}) =>
  app.request(
    path,
    {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
        ...(init.origin ? { Origin: init.origin } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    },
    env,
  )

let n = 0
async function signup(name = 'Player') {
  const email = `p${++n}@test.dev`
  const res = await call('/api/auth/register', { body: { name, email, password: 'secret-pass-1' } })
  const j = (await res.json()) as { token: string; user: { id: number } }
  return { email, token: j.token, id: j.user.id }
}

describe('auth', () => {
  it('registers, never returns the password, and the token works', async () => {
    const res = await call('/api/auth/register', { body: { name: 'Hinawi', email: 'Hinawi@Test.dev', password: 'secret-pass-1' } })
    expect(res.status).toBe(201)
    const j = (await res.json()) as { user: Record<string, unknown>; token: string }
    expect(j.user.email).toBe('hinawi@test.dev')
    expect(JSON.stringify(j)).not.toContain('password')
    const me = await call('/api/me', { token: j.token })
    expect(me.status).toBe(200)
    expect(((await me.json()) as { user: { name: string } }).user.name).toBe('Hinawi')
  })

  it('stores a hash, not the password, and only the token hash', async () => {
    const u = await signup()
    const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(u.id).first<{ password_hash: string }>()
    expect(row!.password_hash.startsWith('pbkdf2$')).toBe(true)
    expect(row!.password_hash).not.toContain('secret-pass-1')
    const s = await env.DB.prepare('SELECT token_hash FROM sessions WHERE user_id = ?').bind(u.id).first<{ token_hash: string }>()
    expect(s!.token_hash).not.toBe(u.token)
  })

  it('rejects duplicate email, short password, bad email', async () => {
    const u = await signup()
    expect((await call('/api/auth/register', { body: { name: 'Dup', email: u.email, password: 'secret-pass-1' } })).status).toBe(422)
    expect((await call('/api/auth/register', { body: { name: 'Ab', email: 'x@y.dev', password: 'short' } })).status).toBe(422)
    expect((await call('/api/auth/register', { body: { name: 'Ab', email: 'nope', password: 'secret-pass-1' } })).status).toBe(422)
  })

  it('logs in with right password only', async () => {
    const u = await signup()
    const ok = await call('/api/auth/login', { body: { email: u.email, password: 'secret-pass-1' } })
    expect(ok.status).toBe(200)
    expect(((await ok.json()) as { token: string }).token).toBeTruthy()
    expect((await call('/api/auth/login', { body: { email: u.email, password: 'wrong-pass-123' } })).status).toBe(401)
    expect((await call('/api/auth/login', { body: { email: 'ghost@test.dev', password: 'secret-pass-1' } })).status).toBe(401)
  })

  it('logout kills the token; fake and expired tokens fail', async () => {
    const u = await signup()
    expect((await call('/api/auth/logout', { method: 'POST', token: u.token })).status).toBe(200)
    expect((await call('/api/me', { token: u.token })).status).toBe(401)
    expect((await call('/api/me', { token: 'nonsense' })).status).toBe(401)
    expect((await call('/api/me')).status).toBe(401)

    const v = await signup()
    await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE user_id = ?').bind('2000-01-01T00:00:00.000Z', v.id).run()
    expect((await call('/api/me', { token: v.token })).status).toBe(401)
  })

  it('updates display name', async () => {
    const u = await signup()
    const res = await call('/api/me', { method: 'PATCH', token: u.token, body: { name: 'New Name' } })
    expect(((await res.json()) as { user: { name: string } }).user.name).toBe('New Name')
  })

  it('sets, returns and removes the profile photo', async () => {
    const u = await signup()
    const avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    const set = await call('/api/me', { method: 'PATCH', token: u.token, body: { avatar } })
    expect(set.status).toBe(200)
    expect(((await set.json()) as { user: { avatar: string } }).user.avatar).toBe(avatar)
    const me = await call('/api/me', { token: u.token })
    expect(((await me.json()) as { user: { avatar: string } }).user.avatar).toBe(avatar)
    const cleared = await call('/api/me', { method: 'PATCH', token: u.token, body: { avatar: null } })
    expect(((await cleared.json()) as { user: { avatar: string | null } }).user.avatar).toBe(null)
  })

  it('rejects bad profile photos', async () => {
    const u = await signup()
    expect((await call('/api/me', { method: 'PATCH', token: u.token, body: { avatar: 'https://evil.example/x.png' } })).status).toBe(422)
    expect((await call('/api/me', { method: 'PATCH', token: u.token, body: { avatar: 'data:text/html;base64,PHNjcmlwdA==' } })).status).toBe(422)
    expect((await call('/api/me', { method: 'PATCH', token: u.token, body: { avatar: `data:image/png;base64,${'A'.repeat(200_001)}` } })).status).toBe(422)
  })

  it('answers malformed JSON with 422, not 500', async () => {
    const res = await app.request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops' }, env)
    expect(res.status).toBe(422)
  })
})

describe('games', () => {
  it('requires login', async () => {
    expect((await call('/api/games')).status).toBe(401)
    expect((await call('/api/games', { body: { result: 'win' } })).status).toBe(401)
  })

  it('saves, lists, filters, reads and deletes own games', async () => {
    const u = await signup()
    const mk = (result: string, played_at: string) =>
      call('/api/games', { token: u.token, body: { result, opponent: 'bot-3', pgn: '1. e4 e5', moves: 2, played_at } })
    const a = (await (await mk('win', '2026-01-01T10:00:00Z')).json()) as { game: { id: number } }
    await mk('loss', '2026-01-02T10:00:00Z')
    await mk('win', '2026-01-03T10:00:00Z')

    const list = (await (await call('/api/games', { token: u.token })).json()) as { games: { result: string; played_at: string }[]; total: number }
    expect(list.total).toBe(3)
    expect(list.games[0].played_at).toBe('2026-01-03T10:00:00.000Z') // newest first

    const wins = (await (await call('/api/games?result=win', { token: u.token })).json()) as { total: number }
    expect(wins.total).toBe(2)

    const one = await call(`/api/games/${a.game.id}`, { token: u.token })
    expect(one.status).toBe(200)

    const stats = (await (await call('/api/games/stats', { token: u.token })).json()) as { stats: Record<string, number> }
    expect(stats.stats).toEqual({ games: 3, wins: 2, losses: 1, draws: 0, win_rate: 66.7 })

    expect((await call(`/api/games/${a.game.id}`, { method: 'DELETE', token: u.token })).status).toBe(204)
    expect((await call(`/api/games/${a.game.id}`, { token: u.token })).status).toBe(404)
  })

  it('paginates', async () => {
    const u = await signup()
    for (let i = 0; i < 5; i++) await call('/api/games', { token: u.token, body: { result: 'draw' } })
    const r = (await (await call('/api/games?per_page=2&page=3', { token: u.token })).json()) as { games: unknown[]; total: number }
    expect(r.total).toBe(5)
    expect(r.games).toHaveLength(1)
  })

  it("never shows or deletes another player's game", async () => {
    const a = await signup()
    const b = await signup()
    const g = (await (await call('/api/games', { token: a.token, body: { result: 'win' } })).json()) as { game: { id: number } }
    expect((await call(`/api/games/${g.game.id}`, { token: b.token })).status).toBe(404)
    expect((await call(`/api/games/${g.game.id}`, { method: 'DELETE', token: b.token })).status).toBe(404)
    expect(((await (await call('/api/games', { token: b.token })).json()) as { total: number }).total).toBe(0)
    expect((await call(`/api/games/${g.game.id}`, { token: a.token })).status).toBe(200)
  })

  it('validates input', async () => {
    const u = await signup()
    for (const body of [
      {},
      { result: 'won' },
      { result: 'win', mode: 'online' },
      { result: 'win', moves: -1 },
      { result: 'win', moves: 1.5 },
      { result: 'win', pgn: 'x'.repeat(20001) },
      { result: 'win', played_at: '2999-01-01T00:00:00Z' },
      { result: 'win', played_at: 'not a date' },
    ]) {
      expect((await call('/api/games', { token: u.token, body })).status, JSON.stringify(body).slice(0, 60)).toBe(422)
    }
  })

  it('is safe against SQL injection in filters', async () => {
    const u = await signup()
    expect((await call("/api/games?result=win'%20OR%201=1--", { token: u.token })).status).toBe(422)
  })
})

describe('leaderboard', () => {
  it('ranks by 3 per win, 1 per draw; is public; hides emails', async () => {
    const top = await signup('Top')
    const mid = await signup('Mid')
    for (let i = 0; i < 3; i++) await call('/api/games', { token: top.token, body: { result: 'win' } })
    await call('/api/games', { token: mid.token, body: { result: 'win' } })
    await call('/api/games', { token: mid.token, body: { result: 'draw' } })
    await call('/api/games', { token: mid.token, body: { result: 'loss' } })

    const res = await call('/api/leaderboard?kind=games&limit=100')
    expect(res.status).toBe(200)
    const j = (await res.json()) as { entries: { rank: number; name: string; points: number; wins: number; games: number }[] }
    const t = j.entries.find((e) => e.name === 'Top')!
    const m = j.entries.find((e) => e.name === 'Mid')!
    expect(t.points).toBe(9)
    expect(m.points).toBe(4)
    expect(t.rank).toBeLessThan(m.rank)
    expect(JSON.stringify(j)).not.toContain('@')
    expect(j.entries.map((e) => e.rank)).toEqual(j.entries.map((_, i) => i + 1))
  })

  it('week period ignores old games', async () => {
    const u = await signup('Oldie')
    await call('/api/games', { token: u.token, body: { result: 'win', played_at: '2020-01-01T00:00:00Z' } })
    const all = (await (await call('/api/leaderboard?limit=100')).json()) as { entries: { name: string }[] }
    const week = (await (await call('/api/leaderboard?period=week&limit=100')).json()) as { entries: { name: string }[] }
    expect(all.entries.some((e) => e.name === 'Oldie')).toBe(true)
    expect(week.entries.some((e) => e.name === 'Oldie')).toBe(false)
  })

  it('ranks rush by best score, one row per player', async () => {
    const a = await signup('RushA')
    const b = await signup('RushB')
    await call('/api/scores', { token: a.token, body: { kind: 'rush', points: 12 } })
    const second = (await (await call('/api/scores', { token: a.token, body: { kind: 'rush', points: 30 } })).json()) as { best: number }
    expect(second.best).toBe(30)
    await call('/api/scores', { token: a.token, body: { kind: 'rush', points: 5 } })
    await call('/api/scores', { token: b.token, body: { kind: 'rush', points: 20 } })
    const j = (await (await call('/api/leaderboard?kind=rush&limit=100')).json()) as { entries: { name: string; points: number }[] }
    const mine = j.entries.filter((e) => e.name === 'RushA')
    expect(mine).toHaveLength(1)
    expect(mine[0].points).toBe(30)
    expect(j.entries.findIndex((e) => e.name === 'RushA')).toBeLessThan(j.entries.findIndex((e) => e.name === 'RushB'))
  })

  it('validates query and caps limit', async () => {
    expect((await call('/api/leaderboard?kind=bogus')).status).toBe(422)
    expect((await call('/api/leaderboard?period=year')).status).toBe(422)
    expect((await call('/api/leaderboard?limit=9999')).status).toBe(200)
  })
})

describe('scores', () => {
  it('validates and reports personal bests', async () => {
    const u = await signup()
    expect((await call('/api/scores', { token: u.token, body: { kind: 'chess', points: 1 } })).status).toBe(422)
    expect((await call('/api/scores', { token: u.token, body: { kind: 'rush', points: -1 } })).status).toBe(422)
    expect((await call('/api/scores', { token: u.token, body: { kind: 'rush', points: 999999 } })).status).toBe(422)
    await call('/api/scores', { token: u.token, body: { kind: 'rush', points: 7 } })
    await call('/api/scores', { token: u.token, body: { kind: 'rush', points: 9 } })
    const mine = (await (await call('/api/scores/mine', { token: u.token })).json()) as { scores: { kind: string; best: number; attempts: number }[] }
    expect(mine.scores).toEqual([{ kind: 'rush', best: 9, attempts: 2 }])
  })
})

describe('progress sync', () => {
  it('is empty at first, then stores and returns progress per player', async () => {
    const a = await signup()
    const b = await signup()
    expect(((await (await call('/api/progress', { token: a.token })).json()) as { progress: unknown }).progress).toBeNull()
    const body = { lessons: ['l1'], puzzles: ['p1', 'p2'], wins: { 'bot-1': 2 }, games: 4, junk: 'dropped' }
    const put = await call('/api/progress', { method: 'PUT', token: a.token, body })
    expect(put.status).toBe(200)
    const got = (await (await call('/api/progress', { token: a.token })).json()) as { progress: Record<string, unknown> }
    expect(got.progress).toEqual({ lessons: ['l1'], puzzles: ['p1', 'p2'], wins: { 'bot-1': 2 }, games: 4 })
    expect(((await (await call('/api/progress', { token: b.token })).json()) as { progress: unknown }).progress).toBeNull()
  })

  it('rejects wrong shapes', async () => {
    const u = await signup()
    for (const body of [{ lessons: 'x' }, { lessons: [1] }, { wins: { a: -1 } }, { games: 'many' }, []]) {
      expect((await call('/api/progress', { method: 'PUT', token: u.token, body })).status).toBe(422)
    }
  })
})

describe('admin', () => {
  it('flags admin on /api/me and gates /api/admin/overview server-side', async () => {
    const plain = await signup()
    const mePlain = await call('/api/me', { token: plain.token })
    expect(((await mePlain.json()) as { user: { admin: boolean } }).user.admin).toBe(false)
    expect((await call('/api/admin/overview')).status).toBe(401)
    expect((await call('/api/admin/overview', { token: plain.token })).status).toBe(403)

    const boss = await signup('Boss')
    await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind('3asfuur@gmail.com', boss.id).run()
    const meBoss = await call('/api/me', { token: boss.token })
    expect(((await meBoss.json()) as { user: { admin: boolean } }).user.admin).toBe(true)

    const res = await call('/api/admin/overview', { token: boss.token })
    expect(res.status).toBe(200)
    const j = (await res.json()) as {
      counts: { users: number; games: number }
      recentUsers: { email: string }[]
      health: { database: boolean; adminCount: number }
    }
    expect(j.counts.users).toBeGreaterThan(0)
    expect(j.health.database).toBe(true)
    expect(j.health.adminCount).toBe(1)
    expect(j.recentUsers.length).toBeGreaterThan(0)
    expect(j.recentUsers.every((r) => r.email.includes('***'))).toBe(true)
    expect(JSON.stringify(j)).not.toContain('3asfuur@gmail.com')
    expect(JSON.stringify(j)).not.toContain('secret-pass-1')
    expect(JSON.stringify(j)).not.toContain('pbkdf2$')
  })
})

describe('http', () => {
  it('ping works and unknown routes are JSON 404', async () => {
    expect(((await (await call('/api/ping')).json()) as { ok: boolean }).ok).toBe(true)
    const r = await call('/api/nope')
    expect(r.status).toBe(404)
    expect(((await r.json()) as { error: string }).error).toBe('not_found')
  })

  it('CORS allows the site and blocks other origins', async () => {
    const ok = await call('/api/ping', { origin: 'https://chesti.pages.dev' })
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://chesti.pages.dev')
    const bad = await call('/api/ping', { origin: 'https://evil.example' })
    expect(bad.headers.get('access-control-allow-origin')).toBeNull()
  })
})
