'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { today, useProgress } from '../lib/progress'
import { rankOf, streakOf, xpOf } from '../lib/rank'

/** Small rank + streak pill in the header; links to the profile. */
export default function RankChip() {
  const p = useProgress()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <span className="h-8 w-20" aria-hidden />
  const xp = xpOf(p)
  const r = rankOf(xp)
  const streak = streakOf(p.days, today())
  return (
    <span className="flex items-center gap-1.5">
      <Link
        href="/me"
        aria-label={`مستواك: ${r.name}، ${xp} نقطة`}
        className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold transition hover:border-gold"
      >
        <span className="shrink-0 text-base leading-none" aria-hidden>{r.icon}</span>
        <span className="ltr shrink-0">{xp}</span>
      </Link>
      {streak > 0 && (
        <Link
          href="/me"
          aria-label={`${streak} يوم ورا بعض`}
          className="ltr flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-[#f39c4a]/40 bg-[#f39c4a]/10 px-2 py-1 text-xs font-bold text-[#f39c4a] transition hover:border-[#f39c4a]"
        >
          🔥{streak}
        </Link>
      )}
    </span>
  )
}
