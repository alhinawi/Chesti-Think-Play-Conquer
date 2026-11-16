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
async function signup(name = 'Live') {
  const email = `live${++n}@test.dev`
  const res = await call('/api/auth/register', { body: { name, email, password: 'secret-pass-1' } })
  const j = (await res.json()) as { token: string; user: { id: number } }
  return { email, token: j.token, id: j.user.id }
}

async function startGame(token: string, color: 'white' | 'black' = 'white') {
  const res = await call('/api/live/start', { token, body: { opponent: 'fischer', color } })
  return res
}

describe('live games (server-authoritative anti-cheat)', () => {
  it('starts a live game from the initial position', async () => {
    const u = await signup()
    const res = await startGame(u.token)
    expect(res.status).toBe(201)
    const j = (await res.json()) as { live: { id: number; fen: string } }
    expect(j.live.id).toBeGreaterThan(0)
    expect(j.live.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    const row = await env.DB.prepare('SELECT * FROM live_games WHERE id = ?').bind(j.live.id).first<{ status: string }>()
    expect(row!.status).toBe('active')
  })

  it('requires auth and validates input', async () => {
    expect((await call('/api/live/start', { body: { opponent: 'fischer', color: 'white' } })).status).toBe(401)
    const u = await signup()
    expect((await call('/api/live/start', { token: u.token, body: { color: 'white' } })).status).toBe(422)
    expect((await call('/api/live/start', { token: u.token, body: { opponent: 'fischer', color: 'green' } })).status).toBe(422)
  })

  it('accepts legal moves, stamps server time, rejects illegal ones', async () => {
    const u = await signup()
    const id = ((await (await startGame(u.token)).json()) as { live: { id: number } }).live.id

    const ok = await call(`/api/live/${id}/move`, { token: u.token, body: { uci: 'e2e4' } })
    expect(ok.status).toBe(200)
    const okJ = (await ok.json()) as { ok: boolean; fen: string; over: boolean }
    expect(okJ.fen).toContain(' b ')

    const bad = await call(`/api/live/${id}/move`, { token: u.token, body: { uci: 'e7e4' } })
    expect(bad.status).toBe(422)

    const row = await env.DB.prepare('SELECT moves, fen FROM live_games WHERE id = ?').bind(id).first<{ moves: string; fen: string }>()
    const moves = JSON.parse(row!.moves) as { uci: string; side: string; t: number }[]
    expect(moves).toHaveLength(1)
    expect(moves[0].side).toBe('w')
    expect(moves[0].t).toBeGreaterThan(0)
    expect(row!.fen).toBe(okJ.fen)
  })

  it('auto-finishes on checkmate and records a valid game', async () => {
    const u = await signup()
    const id = ((await (await startGame(u.token)).json()) as { live: { id: number } }).live.id
    // scholar's mate
    for (const uci of ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6']) {
      const r = await call(`/api/live/${id}/move`, { token: u.token, body: { uci } })
      expect(r.status).toBe(200)
    }
    const mate = await call(`/api/live/${id}/move`, { token: u.token, body: { uci: 'h5f7' } })
    expect(mate.status).toBe(200)
    const mj = (await mate.json()) as { over: boolean; result: string }
    expect(mj.over).toBe(true)
    expect(mj.result).toBe('win')

    const row = await env.DB.prepare('SELECT status, game_id FROM live_games WHERE id = ?').bind(id).first<{ status: string; game_id: number }>()
    expect(row!.status).toBe('finished')
    const game = await env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(row!.game_id).first<{ pgn: string; result: string; moves: number }>()
    expect(game!.result).toBe('win')
    expect(game!.moves).toBe(7)
    expect(game!.pgn).toContain('Qxf7#')

    // further moves are rejected
    expect((await call(`/api/live/${id}/move`, { token: u.token, body: { uci: 'a7a6' } })).status).toBe(409)
  })

  it('end finalizes a resigned game with trusted server timing and flags robotic fast play', async () => {
    const u = await signup()
    const id = ((await (await startGame(u.token)).json()) as { live: { id: number } }).live.id
    // 32 plies = 16 user moves; then backdate server timestamps to 500ms spacing
    const seq = ['a2a3','a7a5','a3a4','b7b5','a4b5','a5a4','b2b3','a4a3','b3b4','a3a2','b5b6','a2b1b','b4b5','b1a2','b6b7','a2b1','b5b6','b1a2','c1a3','a2b1','a3b2','b1a2','b2c1','a2b1','c1a3','b1a2','a3b2','a2b1','b2c3','b1a2','c3a5','a2b1']
    for (const uci of seq) {
      const r = await call(`/api/live/${id}/move`, { token: u.token, body: { uci } })
      expect(r.status).toBe(200)
    }
    // backdate: every half-move exactly 500ms after the previous, ending now
    const row = await env.DB.prepare('SELECT moves FROM live_games WHERE id = ?').bind(id).first<{ moves: string }>()
    const moves = JSON.parse(row!.moves) as { uci: string; side: string; t: number }[]
    const now = Date.now()
    moves.forEach((m, i) => { m.t = now - (moves.length - i) * 300 })
    await env.DB.prepare('UPDATE live_games SET moves = ? WHERE id = ?').bind(JSON.stringify(moves), id).run()

    const end = await call(`/api/live/${id}/end`, { token: u.token, body: { result: 'win', signals: { blurs: 0, pastes: 0, level: 6 } } })
    expect(end.status).toBe(200)
    const ej = (await end.json()) as { ok: boolean; game_id: number }

    const tel = await env.DB.prepare('SELECT move_times, signals FROM game_telemetry WHERE game_id = ?').bind(ej.game_id).first<{ move_times: string; signals: string }>()
    const times = JSON.parse(tel!.move_times) as number[]
    expect(times).toHaveLength(15) // user moves 2..16 measured against previous ply
    expect(times.every((t) => t === 300)).toBe(true) // user think time = 300ms after each opponent ply

    const flag = await env.DB.prepare('SELECT risk_score, reasons FROM game_flags WHERE game_id = ?').bind(ej.game_id).first<{ risk_score: number; reasons: string }>()
    expect(flag).toBeTruthy()
    expect(flag!.risk_score).toBeGreaterThanOrEqual(50)
    const reasons = JSON.parse(flag!.reasons) as string[]
    expect(reasons).toContain('impossibly_fast')
    expect(reasons).toContain('robotic_timing')
    expect(reasons).toContain('server_timed')

    // idempotent end
    const again = await call(`/api/live/${id}/end`, { token: u.token, body: { result: 'win' } })
    expect(again.status).toBe(200)
    expect(((await again.json()) as { game_id: number }).game_id).toBe(ej.game_id)
  })

  it('rate limits game starts', async () => {
    const u = await signup()
    for (let i = 0; i < 30; i++) {
      await env.DB.prepare("INSERT INTO live_games (user_id, opponent, color, fen) VALUES (?, 'fischer', 'white', 'startpos')").bind(u.id).run()
    }
    const res = await startGame(u.token)
    expect(res.status).toBe(429)
    expect(((await res.json()) as { error: string }).error).toBe('rate_limited')
  })

  it('sweeps stale active games into abandoned on the next start', async () => {
    const u = await signup()
    const id = ((await (await startGame(u.token)).json()) as { live: { id: number } }).live.id
    await env.DB.prepare("UPDATE live_games SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour') WHERE id = ?").bind(id).run()
    const res = await startGame(u.token)
    expect(res.status).toBe(201)
    const old = await env.DB.prepare('SELECT status FROM live_games WHERE id = ?').bind(id).first<{ status: string }>()
    expect(old!.status).toBe('abandoned')
  })

  it('isolates games between users', async () => {
    const a = await signup()
    const b = await signup()
    const id = ((await (await startGame(a.token)).json()) as { live: { id: number } }).live.id
    expect((await call(`/api/live/${id}/move`, { token: b.token, body: { uci: 'e2e4' } })).status).toBe(404)
    expect((await call(`/api/live/${id}`, { token: b.token, method: 'GET' })).status).toBe(404)
  })
})
