'use client'

import { useCallback, useEffect, useState } from 'react'

// Local progress (no account needed): lessons finished and puzzles solved.
const KEY = 'chesti-progress'

export interface Progress {
  lessons: string[]
  puzzles: string[]
  traps: string[]
  openings: string[]
  endgames: string[]
  /** wins against each bot id */
  wins: Record<string, number>
  /** local dates (YYYY-MM-DD) the daily puzzle was solved */
  daily: string[]
  /** local dates with any activity, for the streak */
  days: string[]
  /** finished games against the computer */
  games: number
  /** best guess-the-move result per famous game id */
  guesses?: Record<string, { hits: number; total: number; score: number }>
}

type ListKey = 'lessons' | 'puzzles' | 'traps' | 'openings' | 'endgames'

export const EMPTY_PROGRESS: Progress = { lessons: [], puzzles: [], traps: [], openings: [], endgames: [], wins: {}, daily: [], days: [], games: 0 }
const EMPTY = EMPTY_PROGRESS

export function today(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function read(): Progress {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...EMPTY }
  }
}

const listeners = new Set<() => void>()

function write(p: Progress) {
  const d = today()
  if (!p.days.includes(d)) p.days = [...p.days, d].slice(-400)
  localStorage.setItem(KEY, JSON.stringify(p))
  listeners.forEach((l) => l())
}

export function readProgress(): Progress {
  return read()
}

/** overwrite local progress (e.g. after a server merge) and notify subscribers */
export function writeProgress(p: Progress) {
  write(p)
}

export function markDone(kind: ListKey, id: string) {
  const p = read()
  if (p[kind].includes(id)) return
  p[kind] = [...p[kind], id]
  write(p)
}

/** keep the best guess-the-move run for a famous game */
export function recordGuess(gameId: string, hits: number, total: number, score: number) {
  const p = read()
  const prev = p.guesses?.[gameId]
  if (prev && (prev.score > score || (prev.score === score && prev.hits >= hits))) return
  p.guesses = { ...(p.guesses || {}), [gameId]: { hits, total, score } }
  write(p)
}

/** a finished game against a bot; won = the user won */
export function recordGame(botId: string, won: boolean) {
  const p = read()
  p.games = (p.games || 0) + 1
  if (won) p.wins = { ...p.wins, [botId]: (p.wins[botId] || 0) + 1 }
  write(p)
}

export function markDaily(date = today()) {
  const p = read()
  if (p.daily.includes(date)) return
  p.daily = [...p.daily, date]
  write(p)
}

export function useProgress() {
  const [p, setP] = useState<Progress>(EMPTY)
  useEffect(() => {
    const sync = () => setP(read())
    sync()
    listeners.add(sync)
    window.addEventListener('storage', sync)
    return () => {
      listeners.delete(sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const reset = useCallback(() => {
    localStorage.removeItem(KEY)
    listeners.forEach((l) => l())
  }, [])
  return { ...p, reset }
}
