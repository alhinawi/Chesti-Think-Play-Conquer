'use client'

import { useCallback, useEffect, useState } from 'react'

// Local progress (no account needed): lessons finished and puzzles solved.
const KEY = 'chesti-progress'

interface Progress {
  lessons: string[]
  puzzles: string[]
  traps: string[]
}

const EMPTY: Progress = { lessons: [], puzzles: [], traps: [] }

function read(): Progress {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return EMPTY
  }
}

const listeners = new Set<() => void>()

export function markDone(kind: keyof Progress, id: string) {
  const p = read()
  if (p[kind].includes(id)) return
  p[kind] = [...p[kind], id]
  localStorage.setItem(KEY, JSON.stringify(p))
  listeners.forEach((l) => l())
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
