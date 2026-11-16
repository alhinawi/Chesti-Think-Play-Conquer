// Live server-authoritative games: the strongest anti-cheat upgrade we can
// make without paid infrastructure. Instead of trusting a PGN uploaded after
// the fact, every half-move is relayed here during play, validated against the
// stored position with chess.js, and stamped with the SERVER clock. A patched
// client can still wait before moving, but it cannot fake impossible speed,
// robotic consistency, or upload a fabricated game with believable timing.
//
// Games are still recorded into the normal `games` table when they end, so
// stats, history, and the leaderboard keep working unchanged.

import { Chess } from 'chess.js'
import type { Context, MiddlewareHandler } from 'hono'
import { cleanTelemetry, FLAG_THRESHOLD, scoreGame, type Telemetry } from './anticheat'
import { asBody, oneOf, str, ValidationError } from './validate'

type Env = { Bindings: Cloudflare.Env; Variables: { userId: number } }
type C = Context<Env>

const COLORS = ['white', 'black'] as const
const RESULTS = ['win', 'loss', 'draw'] as const
const MAX_LIVE_STARTS_PER_HOUR = 30
const MAX_PLIES = 400
const ABANDON_AFTER_MINUTES = 20

interface LiveRow {
  id: number
  user_id: number
  opponent: string
  color: 'white' | 'black'
  fen: string
  moves: string
  status: 'active' | 'finished' | 'abandoned'
  game_id: number | null
  created_at: string
  updated_at: string
}

interface LiveMove {
  uci: string
  side: 'w' | 'b'
  t: number // server ms epoch when the move arrived
}

async function body(c: C) {
  try {
    return asBody(await c.req.json())
  } catch (e) {
    if (e instanceof ValidationError) throw e
    throw new ValidationError({ body: 'invalid JSON' })
  }
}

/** Mark stale active games of this user as abandoned. */
async function sweepAbandoned(db: D1Database, userId: number) {
  await db
    .prepare(
      `UPDATE live_games SET status = 'abandoned'
       WHERE user_id = ? AND status = 'active'
         AND updated_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
    )
    .bind(userId, `-${ABANDON_AFTER_MINUTES} minutes`)
    .run()
}

/** Count live games started in the last hour (rate limit input). */
async function startsLastHour(db: D1Database, userId: number) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM live_games
       WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')`,
    )
    .bind(userId)
    .first<{ n: number }>()
  return row?.n ?? 0
}

/**
 * Turn a finished live game into a normal recorded game: rebuild the PGN from
 * the relayed moves, derive trusted move timings from the server timestamps,
 * score the anti-cheat risk, and flag for review when needed.
 */
async function finalize(
  db: D1Database,
  live: LiveRow,
  result: 'win' | 'loss' | 'draw',
  clientSignals: unknown,
): Promise<{ gameId: number }> {
  const moves = JSON.parse(live.moves) as LiveMove[]

  // Rebuild the game. Every move was validated when it arrived, so this can
  // only fail on corruption - which itself is worth not recording silently.
  const chess = new Chess()
  for (const m of moves) {
    const from = m.uci.slice(0, 2)
    const to = m.uci.slice(2, 4)
    const promotion = m.uci.length > 4 ? m.uci[4] : undefined
    const applied = chess.move({ from, to, promotion })
    if (!applied) throw new ValidationError({ moves: 'stored moves do not replay' })
  }
  chess.header('White', live.color === 'white' ? 'Player' : live.opponent)
  chess.header('Black', live.color === 'black' ? 'Player' : live.opponent)
  chess.header('Result', result === 'draw' ? '1/2-1/2' : result === 'win' ? (live.color === 'white' ? '1-0' : '0-1') : live.color === 'white' ? '0-1' : '1-0')

  // Trusted timing: for each user move, ms since the previous half-move
  // arrived at the server. This includes network jitter but no client lies.
  const userSide = live.color === 'white' ? 'w' : 'b'
  const times: number[] = []
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].side !== userSide) continue
    const prev = i > 0 ? moves[i - 1].t : null
    if (prev !== null && moves[i].t >= prev) times.push(moves[i].t - prev)
  }

  const duration = moves.length >= 2 ? Math.round((moves[moves.length - 1].t - moves[0].t) / 1000) : null

  const res = await db
    .prepare(
      'INSERT INTO games (user_id, mode, opponent, color, result, pgn, moves, duration_seconds, played_at) VALUES (?,?,?,?,?,?,?,?,?)',
    )
    .bind(live.user_id, 'computer', live.opponent, live.color, result, chess.pgn(), moves.length, duration, live.created_at)
    .run()
  const gameId = res.meta.last_row_id as number

  const cleaned = cleanTelemetry({ signals: clientSignals })
  const telemetry: Telemetry = {
    move_times: times,
    ...(cleaned?.signals ? { signals: cleaned.signals } : {}),
  }
  await db
    .prepare('INSERT OR REPLACE INTO game_telemetry (game_id, user_id, move_times, signals) VALUES (?, ?, ?, ?)')
    .bind(gameId, live.user_id, JSON.stringify(telemetry.move_times), telemetry.signals ? JSON.stringify(telemetry.signals) : null)
    .run()

  const recent = await db
    .prepare('SELECT result FROM games WHERE user_id = ? AND id != ? ORDER BY played_at DESC, id DESC LIMIT 10')
    .bind(live.user_id, gameId)
    .all<{ result: string }>()
  const risk = scoreGame({
    telemetry,
    timingTrusted: true,
    result,
    moves: moves.length,
    durationSeconds: duration,
    recentWins: recent.results.filter((r) => r.result === 'win').length,
    recentGames: recent.results.length,
  })
  if (risk.score >= FLAG_THRESHOLD) {
    await db
      .prepare('INSERT OR REPLACE INTO game_flags (game_id, user_id, risk_score, reasons) VALUES (?, ?, ?, ?)')
      .bind(gameId, live.user_id, risk.score, JSON.stringify(risk.reasons))
      .run()
  }
  return { gameId }
}

function derivedResult(chess: Chess, userColor: 'white' | 'black'): 'win' | 'loss' | 'draw' | null {
  if (chess.isCheckmate()) {
    // side to move is mated
    const loser = chess.turn()
    const userLost = (loser === 'w') === (userColor === 'white')
    return userLost ? 'loss' : 'win'
  }
  if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition() || chess.isDraw()) return 'draw'
  return null
}

export function liveRoutes(app: { use: Function; post: Function; get: Function }, auth: MiddlewareHandler<Env>) {
  app.use('/api/live', auth)
  app.use('/api/live/*', auth)

  app.post('/api/live/start', async (c: C) => {
    const b = await body(c)
    const opponent = str(b, 'opponent', { max: 60, min: 1, required: true })!
    const color = oneOf(b, 'color', COLORS, true)!
    const userId = c.get('userId')

    await sweepAbandoned(c.env.DB, userId)
    if ((await startsLastHour(c.env.DB, userId)) >= MAX_LIVE_STARTS_PER_HOUR) {
      return c.json({ error: 'rate_limited' }, 429)
    }

    const res = await c.env.DB
      .prepare("INSERT INTO live_games (user_id, opponent, color, fen) VALUES (?, ?, ?, ?)")
      .bind(userId, opponent, color, new Chess().fen())
      .run()
    const id = res.meta.last_row_id as number
    return c.json({ live: { id, fen: new Chess().fen() } }, 201)
  })

  app.get('/api/live/:id', async (c: C) => {
    const row = await c.env.DB.prepare('SELECT * FROM live_games WHERE id = ? AND user_id = ?')
      .bind(Number(c.req.param('id') ?? ''), c.get('userId'))
      .first<LiveRow>()
    if (!row) return c.json({ error: 'not_found' }, 404)
    return c.json({ live: { id: row.id, fen: row.fen, status: row.status, color: row.color, opponent: row.opponent, plies: (JSON.parse(row.moves) as LiveMove[]).length } })
  })

  app.post('/api/live/:id/move', async (c: C) => {
    const b = await body(c)
    const uci = str(b, 'uci', { max: 8, min: 4 })!
    const row = await c.env.DB.prepare('SELECT * FROM live_games WHERE id = ? AND user_id = ?')
      .bind(Number(c.req.param('id') ?? ''), c.get('userId'))
      .first<LiveRow>()
    if (!row) return c.json({ error: 'not_found' }, 404)
    if (row.status !== 'active') return c.json({ error: 'game_over' }, 409)

    const moves = JSON.parse(row.moves) as LiveMove[]
    if (moves.length >= MAX_PLIES) throw new ValidationError({ uci: 'game too long' })

    const chess = new Chess(row.fen)
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length > 4 ? uci[4] : undefined
    let applied
    try {
      applied = chess.move({ from, to, promotion })
    } catch {
      applied = null
    }
    if (!applied) throw new ValidationError({ uci: 'illegal move' })

    moves.push({ uci, side: chess.turn() === 'w' ? 'b' : 'w', t: Date.now() })
    const fen = chess.fen()
    const result = derivedResult(chess, row.color)

    if (result) {
      const { gameId } = await finalize(c.env.DB, { ...row, moves: JSON.stringify(moves) }, result, null)
      await c.env.DB.prepare("UPDATE live_games SET fen = ?, moves = ?, status = 'finished', game_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
        .bind(fen, JSON.stringify(moves), gameId, row.id)
        .run()
      return c.json({ ok: true, fen, over: true, result })
    }

    await c.env.DB.prepare("UPDATE live_games SET fen = ?, moves = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
      .bind(fen, JSON.stringify(moves), row.id)
      .run()
    return c.json({ ok: true, fen, over: false })
  })

  app.post('/api/live/:id/end', async (c: C) => {
    const b = await body(c)
    const result = oneOf(b, 'result', RESULTS, true)!
    const row = await c.env.DB.prepare('SELECT * FROM live_games WHERE id = ? AND user_id = ?')
      .bind(Number(c.req.param('id') ?? ''), c.get('userId'))
      .first<LiveRow>()
    if (!row) return c.json({ error: 'not_found' }, 404)
    if (row.status === 'finished') return c.json({ ok: true, game_id: row.game_id })
    if (row.status !== 'active') return c.json({ error: 'game_over' }, 409)

    const { gameId } = await finalize(c.env.DB, row, result, b.signals)
    await c.env.DB.prepare("UPDATE live_games SET status = 'finished', game_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
      .bind(gameId, row.id)
      .run()
    return c.json({ ok: true, game_id: gameId })
  })
}
