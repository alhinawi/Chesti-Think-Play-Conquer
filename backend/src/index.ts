import { Hono, type MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { hashPassword, newToken, sha256Hex, verifyPassword } from './crypto'
import { asBody, email, int, isoDate, oneOf, str, ValidationError } from './validate'
import { finishGoogleLogin, googleConfigured, startGoogleLogin } from './google'

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
  return c.json({ user: publicUser(user), token: await openSession(c.env.DB, user.id) }, 201)
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
  return c.json({ user: publicUser(row), token: await openSession(c.env.DB, row.id) })
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
  return c.json({ user: publicUser(u) })
})
const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const AVATAR_MAX = 200_000

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
      throw new ValidationError({ avatar: 'image must be a jpeg/png/webp data URL under 150KB' })
    }
  }
  const u = (await c.env.DB.prepare('SELECT id, name, email, created_at, avatar FROM users WHERE id = ?').bind(c.get('userId')).first<UserRow>())!
  return c.json({ user: publicUser(u) })
})

// ---------- games ----------
app.use('/api/games', auth)
app.use('/api/games/*', auth)

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

  const res = await c.env.DB.prepare(
    'INSERT INTO games (user_id, mode, opponent, color, result, pgn, moves, duration_seconds, played_at) VALUES (?,?,?,?,?,?,?,?,?)',
  )
    .bind(c.get('userId'), mode, opponent, color, result, pgn, moves, duration, playedAt)
    .run()
  const game = await c.env.DB.prepare('SELECT * FROM games WHERE id = ?').bind(res.meta.last_row_id).first()
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
         WHERE g.played_at >= ?
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
         WHERE s.kind = ? AND s.created_at >= ?
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

export default app
