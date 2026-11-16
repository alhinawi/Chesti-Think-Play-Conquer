'use client'

// Soft anti-cheat warning shown to the player themselves: polite and firm,
// never an accusation. Rendered in the app shell; dismiss marks it seen.

import { useEffect, useState } from 'react'
import { getWarnings, markWarningSeen, type PlayerWarning } from '../lib/api'
import { Card } from './ui'

export default function CheatWarningBanner() {
  const [warning, setWarning] = useState<PlayerWarning | null>(null)

  useEffect(() => {
    getWarnings()
      .then((d) => setWarning(d.warnings.find((w) => !w.seen_at) ?? null))
      .catch(() => {})
  }, [])

  if (!warning) return null

  return (
    <Card className="mb-4 border border-gold/40 bg-gold/5 p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">ملحوظة نزاهة اللعب</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{warning.message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            markWarningSeen(warning.id).catch(() => {})
            setWarning(null)
          }}
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-line bg-surface px-3 text-xs font-bold transition hover:text-ink"
        >
          فهمت
        </button>
      </div>
    </Card>
  )
}
