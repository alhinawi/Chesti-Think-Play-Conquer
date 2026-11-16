import { Hono, type MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { Chess } from 'chess.js'
import { hashPassword, newToken, sha256Hex, verifyPassword } from './crypto'
import { asBody, email, int, isoDate, oneOf, str, ValidationError } from './validate'
import { finishGoogleLogin, googleConfigured, startGoogleLogin } from './google'
import { cleanTelemetry, engineBump, FLAG_THRESHOLD, scoreGame } from './anticheat'
import { liveRoutes } from './live'

type Env = { Bindings: Cloudflare.Env; Variables: { userId: number } }

const RESULTS = ['win', 'loss', 'draw'] as const
const MODES = ['computer', 'local'] as const
const COLORS = ['white', 'black'] as const
const KINDS = ['rush', 'puzzles', 'daily'] as const
const SESSION_DAYS = 30
const PROGRESS_LISTS = ['lessons', 'puzzles', 'traps', 'openings', 'endgames', 'daily', 'days']

const app = new Hono<Env>()

app.use('/api/*', async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  return cors({ origin: (o) => (allowed.includes(o) ? o : null), allowHeaders: ['Content-Type', 'Authorization'], maxAge: 600 })(c, next)
})

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: 'validation_failed', fields: err.fields }, 422)
  console.error(err)
  return c.json({ error: 'server_error' }, 500)
})
app.notFound((c) => c.json({ error: 'not_found' }, 404))

async function json(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return asBody(await c.req.json())
  } catch (e) {
    if (e instanceof ValidationError) throw e
    throw new ValidationError({ body: 'invalid JSON' })
  }
}

const auth: MiddlewareHandler<Env> = async (c, next) => {
  const m = /^Bearer (.+)$/.exec(c.req.header('Authorization') ?? '')
  if (!m) return c.json({ error: 'unauthorized' }, 401)
  const row = await c.env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?',
  )
    .bind(await sha256Hex(m[1]), new Date().toISOString())
    .first<{ user_id: number }>()
  if (!row) return c.json({ error: 'unauthorized' }, 401)
  c.set('userId', row.user_id)
  await next()
}

async function openSession(db: D1Database, userId: number) {
  const token = newToken()
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString()
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256Hex(token), userId, expires).run()
  return token
}

type UserRow = { id: number; name: string; email: string; created_at: string; avatar?: string | null }
const publicUser = (u: UserRow) => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at, avatar: u.avatar ?? null })

// ---------- admin ----------
// Server-side admin gate: the signed-in account's email must be listed in the
// ADMIN_EMAILS var (comma-separated). Defaults to the site owner's Google email
// so the panel works before the var is configured on the worker.
const adminEmails = (env: Cloudflare.Env) =>
  (env.ADMIN_EMAILS ?? '3asfuur@gmail.com')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

const isAdminEmail = (env: Cloudflare.Env, mail: string) => adminEmails(env).includes(mail.toLowerCase())

const withAdmin = (env: Cloudflare.Env, u: UserRow) => ({ ...publicUser(u), admin: isAdminEmail(env, u.email) })

const adminOnly: MiddlewareHandler<Env> = async (c, next) => {
  const u = await c.env.DB.prepare('SELECT id, name, email, created_at, avatar FROM users WHERE id = ?').bind(c.get('userId')).first<UserRow>()
  if (!u || !isAdminEmail(c.env, u.email)) return c.json({ error: 'admin_only' }, 403)
  await next()
}

const maskEmail = (mail: string) => {
  const [local, domain] = mail.split('@')
  return `${local.slice(0, 2)}***@${domain ?? ''}`
}

app.get('/api/ping', (c) => c.json({ ok: true, app: 'chesti-api' }))

// Public feature flags for the auth UI (Google button stays hidden until the
// OAuth secrets are configured on the worker).
app.get('/api/auth/config', (c) => c.json({ google: googleConfigured(c.env) }))

// Google OAuth: start (302 to Google) and callback (302 back to the site).
app.get('/api/auth/google/start', (c) => startGoogleLogin(c.req.raw, c.env))
app.get('/api/auth/google/callback', (c) => finishGoogleLogin(c.req.raw, c.env, openSession))

// ---------- auth ----------
app.post('/api/auth/register', async (c) => {
  const b = await json(c)
  const name = str(b, 'name', { min: 2, max: 40, required: true })!.trim()
  if (name.length < 2) throw new ValidationError({ name: 'at least 2 characters' })
  const mail = email(b)
  const password = str(b, 'password', { min: 8, max: 200, required: true })!

  const exists = await c.env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(mail).first()
  if (exists) throw new ValidationError({ email: 'already registered' })

  const res = await c.env.DB.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .bind(name, mail, await hashPassword(password))
    .run()
  const user = (await c.env.DB.prepare('SELECT id, name, email, created_at, avatar FROM users WHERE id = ?').bind(res.meta.last_row_id).first<UserRow>())!
  return c.json({ user: withAdmin(c.env, user), token: await openSession(c.env.DB, user.id) }, 201)
})

app.post('/api/auth/login', async (c) => {
  const b = await json(c)
  const mail = email(b)
  const password = str(b, 'password', { max: 200, required: true })!
  const row = await c.env.DB.prepare('SELECT id, name, email, created_at, password_hash FROM users WHERE email = ?')
    .bind(mail)
    .first<UserRow & { password_hash: string }>()
  // Run a hash even for unknown emails so timing does not reveal which emails exist.
  const ok = row ? await verifyPassword(password, row.password_hash) : (await hashPassword(password), false)
  if (!row || !ok) return c.json({ error: 'invalid_credentials' }, 401)
  return c.json({ user: withAdmin(c.env, row), token: await openSession(c.env.DB, row.id) })
})

app.use('/api/auth/logout', auth)
app.post('/api/auth/logout', async (c) => {
  const token = /^Bearer (.+)$/.exec(c.req.header('Authorization') ?? '')![1]
  await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run()
  return c.json({ message: 'logged_out' })
})

app.use('/api/me', auth)
app.get('/api/me', async (c) => {
  const u = (await c.env.DB.prepare('SELECT id, name, email, created_at, avatar FROM users WHERE id = ?').bind(c.get('userId')).first<UserRow>())!
  return c.json({ user: withAdmin(c.env, u) })
})
const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const AVATAR_MAX = 41_000 // ~30KB image as a base64 data URL

app.patch('/api/me', async (c) => {
  const b = await json(c)
  const name = str(b, 'name', { min: 2, max: 40 })?.trim()
  if (name) await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, c.get('userId')).run()
  if ('avatar' in b) {
    const a = b.avatar
    if (a === null || a === '') {
      await c.env.DB.prepare('UPDATE users SET avatar = NULL WHERE id = ?').bind(c.get('userId')).run()
    } else if (typeof a === 'string' && a.length <= AVATAR_MAX && AVATAR_RE.test(a)) {
      await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(a, c.get('userId')).run()
    } else {
      throw new ValidationError({ avatar: 'image must be a jpeg/png/webp data URL under 30KB' })
    }
  }
  const u = (await c.env.DB.prepare('SELECT id, name, email, created_at, avatar FROM users WHERE id = ?').bind(c.get('userId')).first<UserRow>())!
  return c.json({ user: publicUser(u) })
})

// ---------- games ----------
app.use('/api/games', auth)
app.use('/api/games/*', auth)

// Live server-authoritative games (anti-cheat): every half-move validated and
// timestamped by the server during play. See live.ts.
liveRoutes(app, auth)

app.post('/api/games', async (c) => {
  const b = await json(c)
  const result = oneOf(b, 'result', RESULTS, true)!
  const mode = oneOf(b, 'mode', MODES) ?? 'computer'
  const color = oneOf(b, 'color', COLORS) ?? 'white'
  const opponent = str(b, 'opponent', { max: 60 }) ?? null
  const pgn = str(b, 'pgn', { max: 20000 }) ?? null
  const moves = int(b, 'moves', { min: 0, max: 1000 }) ?? 0
  const duration = int(b, 'duration_seconds', { min: 0, max: 86400 }) ?? null
  const playedAt = isoDate(b, 'played_at') ?? new Date().toISOString()

  // Server-side move validation: a PGN that does not replay cleanly is rejected.
  if (pgn) {
    try {
      const g = new Chess()
      g.loadPgn(pgn)
      if (g.history().length === 0) throw new Error('empty')
    } catch {
      throw new ValidationError({ pgn: 'invalid pgn' })
    }
  }

  const res = await c.env.DB.prepare(
    'INSERT INTO games (user_id, mode, opponent, color, result, pgn, moves, duration_seconds, played_at) VALUES (?,?,?,?,?,?,?,?,?)',
  )
    .bind(c.get('userId'), mode, opponent, color, result, pgn, moves, duration, playedAt)
    .run()
  const gameId = res.meta.last_row_id as number

  // Anti-cheat: store the client telemetry (if any) and score the game.
  const telemetry = cleanTelemetry(b.telemetry)
  if (telemetry) {
    await c.env.DB.prepare('INSERT OR REPLACE INTO game_telemetry (game_id, user_id, move_times, signals) VALUES (?, ?, ?, ?)')
      .bind(gameId, c.get('userId'), telemetry.move_times ? JSON.stringify(telemetry.move_times) : null, telemetry.signals ? JSON.stringify(telemetry.signals) : null)
      .run()
  }
  const recent = await c.env.DB.prepare(
    "SELECT result FROM games WHERE user_id = ? AND id != ? ORDER BY played_at DESC, id DESC LIMIT 10",
  )
    .bind(c.get('userId'), gameId)
    .all<{ result: string }>()
  const risk = scoreGame({
    telemetry,
    result,
    moves,
    durationSeconds: duration,
    recentWins: recent.results.filter((r) => r.result === 'win').length,
    recentGames: recent.results.length,
  })
  if (risk.score >= FLAG_THRESHOLD) {
    await c.env.DB.prepare('INSERT OR REPLACE INTO game_flags (game_id, user_id, risk_score, reasons) VALUES (?, ?, ?, ?)')
      .bind(gameId, c.get('userId'), risk.score, JSON.stringify(risk.reasons))
      .run()
  }
  // Never leak the flag state to the submitting client.
  const game = await c.env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first()
  return c.json({ game }, 201)
})

app.get('/api/games/stats', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT result, COUNT(*) AS n FROM games WHERE user_id = ? GROUP BY result')
    .bind(c.get('userId'))
    .all<{ result: string; n: number }>()
  const n = Object.fromEntries(results.map((r) => [r.result, r.n]))
  const wins = n.win ?? 0
  const losses = n.loss ?? 0
  const draws = n.draw ?? 0
  const games = wins + losses + draws
  return c.json({ stats: { games, wins, losses, draws, win_rate: games ? Math.round((wins / games) * 1000) / 10 : 0 } })
})

app.get('/api/games', async (c) => {
  const result = c.req.query('result')
  if (result && !(RESULTS as readonly string[]).includes(result)) throw new ValidationError({ result: `one of: ${RESULTS.join(', ')}` })
  const perPage = Math.min(100, Math.max(1, Number(c.req.query('per_page') ?? 20) || 20))
  const page = Math.max(1, Number(c.req.query('page') ?? 1) || 1)
  const where = result ? 'user_id = ? AND result = ?' : 'user_id = ?'
  const args = result ? [c.get('userId'), result] : [c.get('userId')]
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM games WHERE ${where}`).bind(...args).first<{ n: number }>())!.n
  const { results } = await c.env.DB.prepare(`SELECT * FROM games WHERE ${where} ORDER BY played_at DESC, id DESC LIMIT ? OFFSET ?`)
    .bind(...args, perPage, (page - 1) * perPage)
    .all()
  return c.json({ games: results, page, per_page: perPage, total })
})

app.get('/api/games/:id', async (c) => {
  const game = await c.env.DB.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('userId')).first()
  return game ? c.json({ game }) : c.json({ error: 'not_found' }, 404)
})

app.delete('/api/games/:id', async (c) => {
  const res = await c.env.DB.prepare('DELETE FROM games WHERE id = ? AND user_id = ?').bind(c.req.param('id'), c.get('userId')).run()
  return res.meta.changes ? c.body(null, 204) : c.json({ error: 'not_found' }, 404)
})

// ---------- scores ----------
app.use('/api/scores', auth)
app.use('/api/scores/*', auth)

app.post('/api/scores', async (c) => {
  const b = await json(c)
  const kind = oneOf(b, 'kind', KINDS, true)!
  const points = int(b, 'points', { min: 0, max: 100000, required: true })!
  const res = await c.env.DB.prepare('INSERT INTO scores (user_id, kind, points) VALUES (?, ?, ?)').bind(c.get('userId'), kind, points).run()
  const best = (await c.env.DB.prepare('SELECT MAX(points) AS best FROM scores WHERE user_id = ? AND kind = ?').bind(c.get('userId'), kind).first<{ best: number }>())!.best
  return c.json({ score: { id: res.meta.last_row_id, kind, points }, best }, 201)
})

app.get('/api/scores/mine', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT kind, MAX(points) AS best, COUNT(*) AS attempts FROM scores WHERE user_id = ? GROUP BY kind')
    .bind(c.get('userId'))
    .all()
  return c.json({ scores: results })
})

// ---------- leaderboard (public) ----------
app.get('/api/leaderboard', async (c) => {
  const kind = c.req.query('kind') ?? 'games'
  if (kind !== 'games' && !(KINDS as readonly string[]).includes(kind)) throw new ValidationError({ kind: `one of: games, ${KINDS.join(', ')}` })
  const period = c.req.query('period') ?? 'all'
  if (period !== 'all' && period !== 'week') throw new ValidationError({ period: 'one of: all, week' })
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20) || 20))
  const since = period === 'week' ? new Date(Date.now() - 7 * 86_400_000).toISOString() : '0000'

  let rows: Record<string, unknown>[]
  if (kind === 'games') {
    rows = (
      await c.env.DB.prepare(
        `SELECT u.id AS user_id, u.name AS name, COUNT(*) AS games,
                SUM(CASE WHEN g.result = 'win' THEN 1 ELSE 0 END) AS wins,
                SUM(CASE g.result WHEN 'win' THEN 3 WHEN 'draw' THEN 1 ELSE 0 END) AS points
         FROM games g JOIN users u ON u.id = g.user_id
         WHERE g.played_at >= ? AND u.leaderboard_excluded = 0
         GROUP BY u.id ORDER BY points DESC, wins DESC, u.id ASC LIMIT ?`,
      )
        .bind(since, limit)
        .all()
    ).results
  } else {
    rows = (
      await c.env.DB.prepare(
        `SELECT u.id AS user_id, u.name AS name, MAX(s.points) AS points
         FROM scores s JOIN users u ON u.id = s.user_id
         WHERE s.kind = ? AND s.created_at >= ? AND u.leaderboard_excluded = 0
         GROUP BY u.id ORDER BY points DESC, u.id ASC LIMIT ?`,
      )
        .bind(kind, since, limit)
        .all()
    ).results
  }
  return c.json({ kind, period, entries: rows.map((r, i) => ({ rank: i + 1, ...r })) })
})

// ---------- progress sync ----------
app.use('/api/progress', auth)

app.get('/api/progress', async (c) => {
  const row = await c.env.DB.prepare('SELECT data, updated_at FROM progress WHERE user_id = ?').bind(c.get('userId')).first<{ data: string; updated_at: string }>()
  return c.json({ progress: row ? JSON.parse(row.data) : null, updated_at: row?.updated_at ?? null })
})

app.put('/api/progress', async (c) => {
  const b = await json(c)
  const out: Record<string, unknown> = {}
  for (const k of PROGRESS_LISTS) {
    const v = b[k]
    if (v === undefined) continue
    if (!Array.isArray(v) || v.length > 5000 || v.some((x) => typeof x !== 'string' || x.length > 100)) throw new ValidationError({ [k]: 'array of short strings' })
    out[k] = v
  }
  if (b.wins !== undefined) {
    const w = b.wins
    if (typeof w !== 'object' || w === null || Array.isArray(w) || Object.keys(w).length > 100 || Object.values(w).some((x) => !Number.isInteger(x) || (x as number) < 0))
      throw new ValidationError({ wins: 'object of non-negative integers' })
    out.wins = w
  }
  const games = int(b, 'games', { min: 0, max: 1_000_000 })
  if (games !== undefined) out.games = games
  if (b.guesses !== undefined) {
    const g = b.guesses
    if (typeof g !== 'object' || g === null || Array.isArray(g) || Object.keys(g).length > 500) throw new ValidationError({ guesses: 'object' })
    out.guesses = g
  }
  const text = JSON.stringify(out)
  if (text.length > 200_000) throw new ValidationError({ body: 'too large' })
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  )
    .bind(c.get('userId'), text, now)
    .run()
  return c.json({ progress: out, updated_at: now })
})

// ---------- admin panel ----------
app.use('/api/admin', auth)
app.use('/api/admin/*', auth)
app.use('/api/admin', adminOnly)
app.use('/api/admin/*', adminOnly)

app.get('/api/admin/overview', async (c) => {
  const db = c.env.DB
  const now = new Date().toISOString()
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const users = (await db.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>())!.n
  const newUsers = (await db.prepare('SELECT COUNT(*) AS n FROM users WHERE created_at >= ?').bind(since).first<{ n: number }>())!.n
  const sessions = (await db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?').bind(now).first<{ n: number }>())!.n
  const games = (await db.prepare('SELECT COUNT(*) AS n FROM games').first<{ n: number }>())!.n
  const gamesWeek = (await db.prepare('SELECT COUNT(*) AS n FROM games WHERE played_at >= ?').bind(since).first<{ n: number }>())!.n
  const scores = (await db.prepare('SELECT COUNT(*) AS n FROM scores').first<{ n: number }>())!.n
  const byResult = Object.fromEntries(
    (await db.prepare('SELECT result, COUNT(*) AS n FROM games GROUP BY result').all<{ result: string; n: number }>()).results.map((r) => [r.result, r.n]),
  )
  const bestScores = (
    await db.prepare('SELECT kind, MAX(points) AS best, COUNT(DISTINCT user_id) AS players FROM scores GROUP BY kind ORDER BY best DESC').all()
  ).results
  const topPlayers = (
    await db
      .prepare(
        `SELECT u.name AS name, COUNT(*) AS games,
                SUM(CASE WHEN g.result = 'win' THEN 1 ELSE 0 END) AS wins,
                SUM(CASE g.result WHEN 'win' THEN 3 WHEN 'draw' THEN 1 ELSE 0 END) AS points
         FROM games g JOIN users u ON u.id = g.user_id
         GROUP BY u.id ORDER BY points DESC, wins DESC, u.id ASC LIMIT 5`,
      )
      .all()
  ).results
  const recentUsers = (
    await db.prepare('SELECT name, email, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 8').all<{ name: string; email: string; created_at: string }>()
  ).results.map((r) => ({ name: r.name, email: maskEmail(r.email), created_at: r.created_at }))
  return c.json({
    counts: { users, newUsers, sessions, games, gamesWeek, scores },
    gamesByResult: { win: byResult.win ?? 0, loss: byResult.loss ?? 0, draw: byResult.draw ?? 0 },
    bestScores,
    topPlayers,
    recentUsers,
    health: { database: true, google: googleConfigured(c.env), adminCount: adminEmails(c.env).length, generatedAt: now },
  })
})

// ---------- admin: anti-cheat review queue ----------
// Soft actions only: flag, review (dismiss/confirm), leaderboard exclusion.
// Nothing here bans, deletes games, or touches points - every decision stays
// reversible and human.

type FlagRow = {
  game_id: number
  user_id: number
  risk_score: number
  reasons: string
  status: string
  engine_match: number | null
  engine_top3: number | null
  acpl: number | null
  analyzed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
  name: string
  email: string
  opponent: string | null
  result: string
  color: string
  moves: number
  duration_seconds: number | null
  played_at: string
}

const flagOut = (r: FlagRow) => ({
  game_id: r.game_id,
  user: { id: r.user_id, name: r.name, email: maskEmail(r.email) },
  game: { opponent: r.opponent, result: r.result, color: r.color, moves: r.moves, duration_seconds: r.duration_seconds, played_at: r.played_at },
  risk_score: r.risk_score,
  reasons: JSON.parse(r.reasons) as string[],
  status: r.status,
  engine: r.analyzed_at ? { match: r.engine_match, top3: r.engine_top3, acpl: r.acpl, analyzed_at: r.analyzed_at } : null,
  review_note: r.review_note,
  created_at: r.created_at,
})

const FLAG_SELECT = `SELECT f.*, u.name AS name, u.email AS email,
       g.opponent AS opponent, g.result AS result, g.color AS color,
       g.moves AS moves, g.duration_seconds AS duration_seconds, g.played_at AS played_at
  FROM game_flags f JOIN users u ON u.id = f.user_id JOIN games g ON g.id = f.game_id`

app.get('/api/admin/anticheat/flags', async (c) => {
  const status = c.req.query('status') ?? 'flagged'
  if (!['flagged', 'dismissed', 'confirmed', 'all'].includes(status)) throw new ValidationError({ status: 'one of: flagged, dismissed, confirmed, all' })
  const where = status === 'all' ? '' : 'WHERE f.status = ?'
  const q = `${FLAG_SELECT} ${where} ORDER BY f.status = 'flagged' DESC, f.risk_score DESC, f.created_at DESC LIMIT 100`
  const { results } = await (status === 'all' ? c.env.DB.prepare(q).all<FlagRow>() : c.env.DB.prepare(q).bind(status).all<FlagRow>())
  const counts = Object.fromEntries(
    (await c.env.DB.prepare('SELECT status, COUNT(*) AS n FROM game_flags GROUP BY status').all<{ status: string; n: number }>()).results.map((r) => [r.status, r.n]),
  )
  return c.json({ flags: results.map(flagOut), counts: { flagged: counts.flagged ?? 0, dismissed: counts.dismissed ?? 0, confirmed: counts.confirmed ?? 0 } })
})

// The flagged game's PGN, so the admin's browser can run the engine analysis
// locally (full-game search does not fit in a Worker's CPU budget; the site's
// own Stockfish runs on the admin's machine at review time).
app.get('/api/admin/anticheat/flags/:gameId/game', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const game = await c.env.DB.prepare('SELECT id, pgn, color, opponent, result, moves, played_at FROM games WHERE id = ?').bind(gameId).first()
  return game ? c.json({ game }) : c.json({ error: 'not_found' }, 404)
})

// Store the analysis the admin's browser computed. Numbers only, range-checked;
// the bump rules stay server-side.
app.post('/api/admin/anticheat/flags/:gameId/analysis', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const b = await json(c)
  const num01 = (k: string) => {
    const v = b[k]
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) throw new ValidationError({ [k]: 'number between 0 and 1' })
    return v
  }
  const positions = int(b, 'positions', { min: 1, max: 100, required: true })!
  const match = num01('match')
  const top3 = num01('top3')
  const acplV = b.acpl
  if (typeof acplV !== 'number' || !Number.isFinite(acplV) || acplV < 0 || acplV > 1000) throw new ValidationError({ acpl: 'number between 0 and 1000' })

  const game = await c.env.DB.prepare('SELECT id, user_id FROM games WHERE id = ?').bind(gameId).first<{ id: number; user_id: number }>()
  if (!game) return c.json({ error: 'not_found' }, 404)
  const bump = engineBump({ positions, match, acpl: acplV })
  const now = new Date().toISOString()
  const existing = await c.env.DB.prepare('SELECT risk_score, reasons FROM game_flags WHERE game_id = ?').bind(gameId).first<{ risk_score: number; reasons: string }>()
  const oldReasons = existing ? (JSON.parse(existing.reasons) as string[]) : []
  const reasons = [...new Set([...oldReasons, ...bump.reasons])]
  const score = Math.min(100, (existing?.risk_score ?? 0) + bump.bump)
  await c.env.DB.prepare(
    `INSERT INTO game_flags (game_id, user_id, risk_score, reasons, engine_match, engine_top3, acpl, analyzed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(game_id) DO UPDATE SET risk_score = excluded.risk_score, reasons = excluded.reasons,
       engine_match = excluded.engine_match, engine_top3 = excluded.engine_top3, acpl = excluded.acpl,
       analyzed_at = excluded.analyzed_at, updated_at = excluded.updated_at`,
  )
    .bind(gameId, game.user_id, score, JSON.stringify(reasons), match, top3, acplV, now, now)
    .run()
  return c.json({ risk_score: score, bump: bump.bump, reasons })
})

app.post('/api/admin/anticheat/flags/:gameId/review', async (c) => {
  const gameId = Number(c.req.param('gameId'))
  const b = await json(c)
  const action = oneOf(b, 'action', ['dismiss', 'confirm'] as const, true)!
  const note = str(b, 'note', { max: 500 }) ?? null
  const res = await c.env.DB.prepare('UPDATE game_flags SET status = ?, review_note = ?, updated_at = ? WHERE game_id = ?')
    .bind(action === 'dismiss' ? 'dismissed' : 'confirmed', note, new Date().toISOString(), gameId)
    .run()
  return res.meta.changes ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404)
})

app.post('/api/admin/anticheat/exclude', async (c) => {
  const b = await json(c)
  const userId = int(b, 'user_id', { min: 1, max: 10_000_000, required: true })!
  const excluded = b.excluded === true
  const res = await c.env.DB.prepare('UPDATE users SET leaderboard_excluded = ? WHERE id = ?').bind(excluded ? 1 : 0, userId).run()
  return res.meta.changes ? c.json({ ok: true, excluded }) : c.json({ error: 'not_found' }, 404)
})

app.get('/api/admin/anticheat/excluded', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, email FROM users WHERE leaderboard_excluded = 1 ORDER BY id DESC LIMIT 200').all<{ id: number; name: string; email: string }>()
  return c.json({ excluded: results.map((u) => ({ id: u.id, name: u.name, email: maskEmail(u.email) })) })
})

export default app
