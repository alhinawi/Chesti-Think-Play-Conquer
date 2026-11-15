'use client'

// Client for the Chesti API (Cloudflare Workers + D1, see backend/).
// The token stays in localStorage; every call works anonymously too (it just skips auth).

const BASE = (process.env.NEXT_PUBLIC_CHESTI_API_URL || 'https://chesti-api.hnz.workers.dev').replace(/\/$/, '')
const TOKEN_KEY = 'chesti-token'

export interface ApiUser {
  id: number
  name: string
  email: string
  /** profile photo as a small data URL, null when unset */
  avatar?: string | null
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  name: string
  games?: number
  wins?: number
  points: number
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // private mode etc.
  }
}

async function req<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (opts.auth && token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(`${BASE}/api${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  if (r.status === 401 && opts.auth) setToken(null)
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : `http_${r.status}`)
  return data as T
}

export async function register(name: string, email: string, password: string): Promise<ApiUser> {
  const d = await req<{ user: ApiUser; token: string }>('/auth/register', { method: 'POST', body: { name, email, password } })
  setToken(d.token)
  return d.user
}

export async function login(email: string, password: string): Promise<ApiUser> {
  const d = await req<{ user: ApiUser; token: string }>('/auth/login', { method: 'POST', body: { email, password } })
  setToken(d.token)
  return d.user
}

export async function logout(): Promise<void> {
  try {
    await req('/auth/logout', { method: 'POST', auth: true })
  } catch {
    // fine either way; drop the local token
  }
  setToken(null)
}

export function me(): Promise<{ user: ApiUser }> {
  return req<{ user: ApiUser }>('/me', { auth: true })
}

export function updateMe(patch: { name?: string; avatar?: string | null }): Promise<{ user: ApiUser }> {
  return req<{ user: ApiUser }>('/me', { method: 'PATCH', auth: true, body: patch })
}

// ---------- Google OAuth ----------

export interface AuthConfig {
  google: boolean
}

/** which sign-in providers the backend is configured for; defaults to hidden */
export async function getAuthConfig(): Promise<AuthConfig> {
  try {
    const r = await fetch(`${BASE}/api/auth/config`)
    if (!r.ok) return { google: false }
    const body = await r.json()
    return { google: Boolean(body && body.google) }
  } catch {
    return { google: false }
  }
}

/** where the site sends the browser to start Google sign-in */
export function googleLoginUrl(): string {
  return `${BASE}/api/auth/google/start?origin=${encodeURIComponent(window.location.origin)}`
}

/**
 * The worker redirects back to <origin>/#auth-callback?token=...&provider=google
 * after Google sign-in. Reads and clears that hash, saving the API token.
 * Returns the token (or "error:<code>") when a callback was consumed.
 */
export function consumeGoogleAuthCallback(): string | null {
  if (typeof window === 'undefined') return null
  const m = /^#auth-callback\?(.*)$/.exec(window.location.hash)
  if (!m) return null
  const params = new URLSearchParams(m[1])
  const token = params.get('token')
  const error = params.get('error')
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  if (token) {
    setToken(token)
    return token
  }
  return error ? `error:${error}` : null
}

export interface SaveGameInput {
  result: 'win' | 'loss' | 'draw'
  mode?: 'computer' | 'local'
  opponent?: string
  color?: 'white' | 'black'
  pgn?: string
  moves?: number
  duration_seconds?: number
  played_at?: string
}

/** fire-and-forget; silently skipped when logged out or offline */
export function saveGame(g: SaveGameInput) {
  if (!getToken()) return
  req('/games', { method: 'POST', body: g, auth: true }).catch(() => {})
}

/** fire-and-forget; silently skipped when logged out or offline */
export function saveScore(kind: 'rush' | 'puzzles' | 'daily', points: number) {
  if (!getToken()) return
  req('/scores', { method: 'POST', body: { kind, points }, auth: true }).catch(() => {})
}

export function getLeaderboard(kind: 'games' | 'rush' | 'puzzles' | 'daily' = 'games', period: 'all' | 'week' = 'all', limit = 20) {
  return req<{ entries: LeaderboardEntry[] }>(`/leaderboard?kind=${kind}&period=${period}&limit=${limit}`)
}

export function getProgress(): Promise<{ progress: Record<string, unknown> | null; updated_at: string | null }> {
  return req('/progress', { auth: true })
}

export function putProgress(data: Record<string, unknown>): Promise<{ ok: boolean }> {
  return req('/progress', { method: 'PUT', body: data, auth: true })
}
