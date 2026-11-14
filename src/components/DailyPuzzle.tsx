'use client'

import { useEffect, useState } from 'react'
import PuzzleSolver from './PuzzleSolver'
import { Badge } from './ui'
import { PUZZLES } from '../data/puzzles'
import { today, useProgress } from '../lib/progress'
import { dailyIndex, streakOf } from '../lib/rank'

export default function DailyPuzzle() {
  const [date, setDate] = useState<string | null>(null)
  const progress = useProgress()
  useEffect(() => setDate(today()), [])
  if (!date) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />
  const i = dailyIndex(date, PUZZLES.length)
  const p = PUZZLES[i]
  const next = PUZZLES[(i + 1) % PUZZLES.length]
  const solvedToday = progress.daily.includes(date)
  const streak = streakOf(progress.days, date)
  const label = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="muted">{label}</Badge>
        <Badge>{p.theme}</Badge>
        <Badge tone="muted">{p.level}</Badge>
        {solvedToday && <Badge tone="emerald">اتحل النهارده</Badge>}
        {streak > 0 && <Badge tone="gold">🔥 {streak} يوم ورا بعض</Badge>}
      </div>
      <h2 className="mb-4 font-display text-xl font-bold">{p.name}</h2>
      <PuzzleSolver key={p.id} puzzleId={p.id} nextId={next.id} daily={date} />
      <p className="mt-6 text-center text-sm text-muted">فيه لغز جديد كل يوم الساعة 12 بالليل، نفس اللغز لكل الناس.</p>
    </div>
  )
}
