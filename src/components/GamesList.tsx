'use client'

import Link from 'next/link'
import { Badge } from './ui'
import { GAMES } from '../data/games'
import { useI18n } from '../lib/i18n'
import { useGameLoc } from '../lib/i18n/content'

export default function GamesList() {
  const en = useI18n().locale === 'en'
  const lt = useGameLoc()
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {GAMES.map((g0) => {
        const g = lt(g0)
        return (
          <li key={g.id}>
            <Link href={`/games/${g.id}`} className="luxe-card flex h-full flex-col rounded-2xl p-5 transition hover:border-gold/50">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-bold">{g.name}</h2>
                <span className="text-sm font-bold text-gold" dir="ltr">{g.year}</span>
              </div>
              <p className="text-sm text-muted">{g.white} × {g.black} — {g.place}</p>
              <p className="mt-2 text-sm">{g.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge tone={g.result === '1-0' ? 'gold' : g.result === '0-1' ? 'emerald' : 'muted'}>{g.result}</Badge>
                <Badge tone="muted">{en ? `${Math.ceil(g.moves.length / 2)} moves` : `${Math.ceil(g.moves.length / 2)} نقلة`}</Badge>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
