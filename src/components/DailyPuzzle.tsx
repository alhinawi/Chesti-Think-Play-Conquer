'use client'

import { useEffect, useState } from 'react'
import PuzzleSolver from './PuzzleSolver'
import { useI18n } from '../lib/i18n'
import { themeSlug, levelSlug } from '../lib/i18n/dataLabels'
import { Badge } from './ui'
import { PUZZLES } from '../data/puzzles'
import { useAuth } from '../lib/auth'
import { today, useProgress } from '../lib/progress'
import { dailyIndex, streakOf } from '../lib/rank'

export default function DailyPuzzle() {
  const [date, setDate] = useState<string | null>(null)
  const progress = useProgress()
  const { status } = useAuth()
  const authed = status === 'authed'
  useEffect(() => setDate(today()), [])
  if (!date) return <div className="h-96 animate-pulse rounded-2xl bg-surface" />
  const i = dailyIndex(date, PUZZLES.length)
  const p = PUZZLES[i]
  const { t, locale } = useI18n()
  const themeLabel = (x: string) => { const s = themeSlug(x); return s ? t(`pz.theme${s[0].toUpperCase() + s.slice(1)}`) : x }
  const levelLabel = (x: string) => { const s = levelSlug(x); return s ? t(`pz.level${s}`) : x }
  const next = PUZZLES[(i + 1) % PUZZLES.length]
  const solvedToday = progress.daily.includes(date)
  const streak = streakOf(progress.days, date)
  const label = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Cairo' }).format(new Date())
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="muted">{label}</Badge>
        <Badge>{themeLabel(p.theme)}</Badge>
        <Badge tone="muted">{levelLabel(p.level)}</Badge>
        {authed && solvedToday && <Badge tone="emerald">{t('pz.solvedToday')}</Badge>}
        {authed && streak > 0 && <Badge tone="gold">{t('pz.dayStreak', { n: streak })}</Badge>}
      </div>
      <h2 className="mb-4 font-display text-xl font-bold">{p.name}</h2>
      <PuzzleSolver key={p.id} puzzleId={p.id} nextId={next.id} daily={date} />
      <p className="mt-6 text-center text-sm text-muted">{t('pz.dailyNote')}</p>
    </div>
  )
}
