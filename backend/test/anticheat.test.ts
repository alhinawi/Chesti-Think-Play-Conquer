import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { cleanTelemetry, scoreGame } from '../src/anticheat'

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
async function signup(name = 'Player', mail?: string) {
  const email = mail ?? `ac${++n}@test.dev`
  const res = await call('/api/auth/register', { body: { name, email, password: 'secret-pass-1' } })
  const j = (await res.json()) as { token: string; user: { id: number } }
  return { email, token: j.token, id: j.user.id }
}

// A short real game (fool's mate from Black's perspective is 2 moves; this one
// is longer so the analyzer has positions to sample).
const PGN = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7'

describe('pgn validation', () => {
  it('rejects an illegal pgn', async () => {
    const u = await signup()
    const res = await call('/api/games', { token: u.token, body: { result: 'win', pgn: '1. e4 e5 2. Ke9##' } })
    expect(res.status).toBe(422)
  })

  it('accepts a legal pgn', async () => {
    const u = await signup()
    const res = await call('/api/games', { token: u.token, body: { result: 'win', pgn: PGN, moves: 20 } })
    expect(res.status).toBe(201)
  })
})

describe('telemetry + risk scoring', () => {
  it('cleanTelemetry accepts a good blob and drops junk', () => {
    expect(cleanTelemetry({ move_times: [1000, 2500], signals: { blurs: 3, pastes: 0 } })).toEqual({ move_times: [1000, 2500], signals: { blurs: 3, pastes: 0, focus_losses: undefined, level: undefined } })
    expect(cleanTelemetry({ move_times: [-5] })).toBeNull()
    expect(cleanTelemetry('nope')).toBeNull()
    expect(cleanTelemetry(undefined)).toBeNull()
  })

  it('flags robotic fast play with tab switching', () => {
    const v = scoreGame({
      telemetry: { move_times: Array(30).fill(500), signals: { blurs: 6 } },
      result: 'win',
      moves: 60,
      durationSeconds: 300,
      recentWins: 0,
      recentGames: 0,
    })
    expect(v.score).toBeGreaterThanOrEqual(50)
    expect(v.reasons).toContain('impossibly_fast')
    expect(v.reasons).toContain('robotic_timing')
    expect(v.reasons).toContain('tab_switching')
  })

  it('does not flag normal human play', () => {
    const v = scoreGame({
      telemetry: { move_times: [3000, 5000, 2000, 8000, 4000, 12000, 6000, 2500, 9000, 3500, 7000, 4500], signals: { blurs: 0 } },
      result: 'win',
      moves: 40,
      durationSeconds: 600,
      recentWins: 3,
      recentGames: 10,
    })
    expect(v.score).toBeLessThan(50)
  })

  it('stores telemetry and flags a suspicious submitted game without leaking it', async () => {
    const u = await signup()
    const res = await call('/api/games', {
      token: u.token,
      body: {
        result: 'win',
        pgn: PGN,
        moves: 20,
        duration_seconds: 45,
        telemetry: { move_times: Array(20).fill(500), signals: { blurs: 6, pastes: 2 } },
      },
    })
    expect(res.status).toBe(201)
    const j = (await res.json()) as { game: { id: number } }
    expect(JSON.stringify(j)).not.toContain('risk')
    const t = await env.DB.prepare('SELECT * FROM game_telemetry WHERE game_id = ?').bind(j.game.id).first()
    expect(t).toBeTruthy()
    const f = await env.DB.prepare('SELECT risk_score FROM game_flags WHERE game_id = ?').bind(j.game.id).first<{ risk_score: number }>()
    expect(f!.risk_score).toBeGreaterThanOrEqual(50)
  })
})

describe('admin anti-cheat queue', () => {
  async function flaggedGame() {
    const u = await signup()
    const res = await call('/api/games', {
      token: u.token,
      body: { result: 'win', pgn: PGN, moves: 20, telemetry: { move_times: Array(20).fill(400), signals: { blurs: 9, pastes: 1 } } },
    })
    const j = (await res.json()) as { game: { id: number } }
    return { user: u, gameId: j.game.id }
  }

  it('is admin-only', async () => {
    const u = await signup()
    expect((await call('/api/admin/anticheat/flags', { token: u.token })).status).toBe(403)
  })

  it('lists, analyzes, reviews and excludes', async () => {
    const admin = await signup('Admin', '3asfuur@gmail.com')
    const { user, gameId } = await flaggedGame()

    const list = await call('/api/admin/anticheat/flags', { token: admin.token })
    expect(list.status).toBe(200)
    const lj = (await list.json()) as { flags: { game_id: number; user: { email: string }; reasons: string[] }[] }
    const row = lj.flags.find((f) => f.game_id === gameId)
    expect(row).toBeTruthy()
    expect(row!.user.email).toContain('***@')
    expect(row!.reasons.length).toBeGreaterThan(0)

    const gg = await call(`/api/admin/anticheat/flags/${gameId}/game`, { token: admin.token })
    expect(gg.status).toBe(200)
    const gres = (await gg.json()) as { game: { pgn: string } }
    expect(gres.game.pgn).toContain('1. e4 e5')

    const an = await call(`/api/admin/anticheat/flags/${gameId}/analysis`, { method: 'POST', token: admin.token, body: { positions: 12, match: 0.92, top3: 0.98, acpl: 12 } })
    expect(an.status).toBe(200)
    const aj = (await an.json()) as { bump: number; reasons: string[] }
    expect(aj.bump).toBeGreaterThan(0)
    expect(aj.reasons).toContain('engine_like_moves')

    const rev = await call(`/api/admin/anticheat/flags/${gameId}/review`, { method: 'POST', token: admin.token, body: { action: 'dismiss', note: 'false positive' } })
    expect(rev.status).toBe(200)

    // exclude from leaderboard, then restore
    expect((await call('/api/admin/anticheat/exclude', { token: admin.token, body: { user_id: user.id, excluded: true } })).status).toBe(200)
    const lb = await call('/api/leaderboard?kind=games')
    const lbj = (await lb.json()) as { entries: { user_id: number }[] }
    expect(lbj.entries.some((e) => e.user_id === user.id)).toBe(false)
    expect((await call('/api/admin/anticheat/exclude', { token: admin.token, body: { user_id: user.id, excluded: false } })).status).toBe(200)
  }, 30000)
})
