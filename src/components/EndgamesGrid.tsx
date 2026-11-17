'use client'

import Link from 'next/link'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ENDGAMES } from '../data/endgames'
import { useI18n } from '../lib/i18n'
import { useEndgameLoc } from '../lib/i18n/content'

export default function EndgamesGrid() {
  const en = useI18n().locale === 'en'
  const lt = useEndgameLoc()
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ENDGAMES.map((e0) => {
        const e = lt(e0)
        const level = en ? (e.level === 'سهل' ? 'Easy' : e.level === 'متوسط' ? 'Medium' : 'Advanced') : e.level
        return (
          <li key={e.id}>
            <Link href={`/endgames/${e.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
              <div className="w-28 shrink-0">
                <MiniBoard fen={e.fen} label={en ? `Position: ${e.name}` : `موقف ${e.name}`} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold">{e.name}</h2>
                <p className="text-xs text-muted" dir="ltr">{e.en}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{e.text}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone={e.level === 'سهل' ? 'emerald' : e.level === 'متوسط' ? 'gold' : 'danger'}>{level}</Badge>
                  <Badge tone="muted">{e.theme}</Badge>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
