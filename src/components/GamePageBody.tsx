'use client'

import Link from 'next/link'
import GameViewer from './GameViewer'
import { Badge } from './ui'
import { GAMES } from '../data/games'
import { useI18n } from '../lib/i18n'
import { useGameLoc } from '../lib/i18n/content'

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default function GamePageBody({ gameId, nextId }: { gameId: string; nextId: string }) {
  const en = useI18n().locale === 'en'
  const lt = useGameLoc()
  const g = lt(GAMES.find((x) => x.id === gameId)!)
  const next = lt(GAMES.find((x) => x.id === nextId)!)
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/games" className="hover:text-gold">{en ? 'Immortal Games' : 'أدوار خالدة'}</Link>
        <span className="mx-2">/</span>
        <span>{g.year}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{g.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{g.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone="muted">{g.white} × {g.black}</Badge>
        <Badge tone="muted">{g.place} {g.year}</Badge>
        <Badge tone={g.result === '1-0' ? 'gold' : g.result === '0-1' ? 'emerald' : 'muted'}>{g.result}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{g.summary}</p>

      <GameViewer gameId={g.id} />

      <section aria-labelledby="lesson" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="lesson" className="mb-2 font-display text-lg font-bold text-gold">{en ? 'The lesson' : 'الدرس المستفاد'}</h2>
        <p className="text-sm">{g.lesson}</p>
      </section>

      <section aria-labelledby="pgn" className="mt-6">
        <h2 id="pgn" className="mb-2 font-display text-lg font-bold">{en ? 'The full game' : 'الدور كامل'}</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm leading-7">{pgn(g.moves)} {g.result}</p>
      </section>

      <nav aria-label={en ? 'More games' : 'أدوار تانية'} className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/games/${next.id}`} className="text-muted hover:text-gold">{en ? `Next game: ${next.name} →` : `الدور الجاي: ${next.name} ←`}</Link>
      </nav>
    </>
  )
}
