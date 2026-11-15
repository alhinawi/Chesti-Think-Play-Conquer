'use client'

import { useCallback, useSyncExternalStore } from 'react'
import * as api from './api'
import { readProgress, writeProgress, type Progress } from './progress'

export type AuthStatus = 'loading' | 'anon' | 'authed'
interface AuthState {
  status: AuthStatus
  user: api.ApiUser | null
}

let state: AuthState = { status: 'loading', user: null }
const listeners = new Set<() => void>()
let started = false

function emit() {
  listeners.forEach((l) => l())
}
function set(s: AuthState) {
  state = s
  emit()
}

function uni(a: string[] = [], b: string[] = []): string[] {
  return [...new Set([...a, ...b])]
}

/** merge local progress with the server's copy (union, best-of) */
function mergeProgress(local: Progress, remote: Partial<Progress> | null): Progress {
  const r = remote ?? {}
  const wins: Record<string, number> = { ...local.wins }
  for (const [k, v] of Object.entries(r.wins ?? {})) wins[k] = Math.max(wins[k] ?? 0, v)
  const guesses: NonNullable<Progress['guesses']> = { ...(local.guesses ?? {}) }
  for (const [k, v] of Object.entries(r.guesses ?? {})) {
    const prev = guesses[k]
    if (!prev || v.score > prev.score || (v.score === prev.score && v.hits > prev.hits)) guesses[k] = v
  }
  return {
    lessons: uni(local.lessons, r.lessons),
    puzzles: uni(local.puzzles, r.puzzles),
    traps: uni(local.traps, r.traps),
    openings: uni(local.openings, r.openings),
    endgames: uni(local.endgames, r.endgames),
    wins,
    daily: uni(local.daily, r.daily),
    days: uni(local.days, r.days).slice(-400),
    games: Math.max(local.games ?? 0, r.games ?? 0),
    guesses,
  }
}

let syncing = false
/** push local progress into the account and pull the merged result back; safe to call often */
export async function syncProgress() {
  if (syncing || !api.getToken()) return
  syncing = true
  try {
    const { progress } = await api.getProgress()
    const merged = mergeProgress(readProgress(), (progress ?? null) as Partial<Progress> | null)
    writeProgress(merged)
    await api.putProgress(merged as unknown as Record<string, unknown>)
  } catch {
    // offline or backend down: local copy is the source until next sync
  } finally {
    syncing = false
  }
}

function afterSignIn(user: api.ApiUser) {
  set({ status: 'authed', user })
  void syncProgress()
}

export async function signIn(email: string, password: string) {
  afterSignIn(await api.login(email, password))
}

export async function signUp(name: string, email: string, password: string) {
  afterSignIn(await api.register(name, email, password))
}

export async function signOut() {
  await api.logout()
  set({ status: 'anon', user: null })
}

function init() {
  if (started || typeof window === 'undefined') return
  started = true
  if (!api.getToken()) {
    set({ status: 'anon', user: null })
    return
  }
  api
    .me()
    .then((d) => afterSignIn(d.user))
    .catch(() => set({ status: 'anon', user: null }))
}

export function useAuth(): AuthState {
  // useSyncExternalStore re-reads `state` right after mount: with no token init()
  // settles synchronously, and consumers mounted after the first emit would
  // otherwise never hear it and stay stuck on the 'loading' render
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb)
    init()
    return () => {
      listeners.delete(cb)
    }
  }, [])
  return useSyncExternalStore(subscribe, () => state, () => state)
}
