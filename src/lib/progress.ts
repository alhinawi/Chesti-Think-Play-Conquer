'use client'

import { useCallback, useEffect, useState } from 'react'

// Local progress (no account needed): lessons finished and puzzles solved.
const KEY = 'chesti-progress'

export interface Progress {
  lessons: string[]
  puzzles: string[]
  traps: string[]
  /** wins against each bot id */
  wins: Record<string, number>
  /** local dates (YYYY-MM-DD) the daily puzzle was solved */
  daily: string[]
  /** local dates with any activity, for the streak */
  days: string[]
  /** finished games against the computer */
  games: number
}

type ListKey = 'lessons' | 'puzzles' | 'traps'

export const EMPTY_PROGRESS: Progress = { lessons: [], puzzles: [], traps: [], wins: {}, daily: [], days: [], games: 0 }
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

export function markDone(kind: ListKey, id: string) {
  const p = read()
  if (p[kind].includes(id)) return
  p[kind] = [...p[kind], id]
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
