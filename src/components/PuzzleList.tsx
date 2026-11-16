'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PUZZLES, PUZZLE_THEMES } from '../data/puzzles'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { Badge, Icon } from './ui'
import { useI18n } from '../lib/i18n'
import { MiniBoard } from './MiniBoard'

export default function PuzzleList() {
  const { t: t2 } = useI18n()
  const { puzzles: solvedAll } = useProgress()
  const { status } = useAuth()
  const authed = status === 'authed'
  const solved = authed ? solvedAll : []
  const [theme, setTheme] = useState<string>('all')
  const list = theme === 'all' ? PUZZLES : PUZZLES.filter((p) => p.theme === theme)
  const next = PUZZLES.find((p) => !solved.includes(p.id))
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t2('pz.filterAria')}>
          {['all', ...PUZZLE_THEMES].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
              className={`rounded-full border px-3 py-1.5 text-sm ${theme === t ? 'border-gold bg-gold-soft text-gold' : 'border-line text-muted hover:text-ink'}`}
            >
              {t === 'all' ? t2('pz.all') : t}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{authed ? t2('pz.progressAuthed', { n: solved.length, total: PUZZLES.length }) : t2('pz.progressGuest', { total: PUZZLES.length })}</p>
      </div>
      {next && (
        <Link href={`/puzzles/${next.id}`} className="mb-5 inline-flex items-center gap-2 font-bold text-gold hover:underline">
          <Icon name="bulb" /> {solved.length ? t2('pz.nextPuzzle') : t2('pz.startFirst')}: {next.name}
        </Link>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => {
          const ok = solved.includes(p.id)
          return (
            <li key={p.id}>
              <Link href={`/puzzles/${p.id}`} className={`block rounded-xl border p-2 transition hover:border-gold/60 ${ok ? 'border-emerald/40' : 'border-line'} bg-surface`}>
                <MiniBoard fen={p.fen} />
                <div className="mt-2 flex items-center justify-between gap-1 px-1">
                  <span className="truncate text-sm font-bold">{p.name}</span>
                  {ok ? <Icon name="check" className="h-4 w-4 shrink-0 text-emerald" /> : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 px-1 pb-1">
                  <Badge tone="muted">{p.theme}</Badge>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
