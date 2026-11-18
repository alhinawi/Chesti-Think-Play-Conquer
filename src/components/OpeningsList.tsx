'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ChipRow, usePersisted, FilterCard, levelOpts, matchesProgress, progressOpts, useDone } from './LibraryFilters'
import { OPENINGS } from '../data/openings'
import { replay, START_FEN } from '../lib/chess'
import { useI18n } from '../lib/i18n'
import { useOpeningLoc } from '../lib/i18n/content'
import { levelSlug } from '../lib/i18n/dataLabels'

const colorOpts = (t: (k: string) => string) => [
  { v: 'all', label: t('lb.forAll') },
  { v: 'w', label: t('lb.forW') },
  { v: 'b', label: t('lb.forB') },
]
const typeOpts = (t: (k: string) => string) => [
  { v: 'all', label: t('lb.typeAll') },
  { v: 'open', label: t('lb.typeOpen') },
  { v: 'semi', label: t('lb.typeSemi') },
  { v: 'closed', label: t('lb.typeClosed') },
  { v: 'flank', label: t('lb.typeFlank') },
]

/** classify from the first moves: e4+e5 open, e4 other semi-open, d4 closed, anything else flank */
export function openingType(moves: string[]): 'open' | 'semi' | 'closed' | 'flank' {
  if (moves[0] === 'e4') return moves[1] === 'e5' ? 'open' : 'semi'
  if (moves[0] === 'd4') return 'closed'
  return 'flank'
}
const TYPE_KEYS: Record<string, string> = { open: 'lb.typeOpen', semi: 'lb.typeSemi', closed: 'lb.typeClosed', flank: 'lb.typeFlank' }

export default function OpeningsList() {
  const { t } = useI18n()
  const lo = useOpeningLoc()
  const [q, setQ] = usePersisted('openings', 'q', '')
  const [side, setSide] = usePersisted('openings', 'side', 'all')
  const [level, setLevel] = usePersisted('openings', 'level', 'all')
  const [prog, setProg] = usePersisted('openings', 'prog', 'all')
  const [type, setType] = usePersisted('openings', 'type', 'all')
  const isDone = useDone('openings')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return OPENINGS.filter((o) => {
      if (side !== 'all' && o.side !== side && o.side !== 'both') return false
      if (level !== 'all' && o.level !== level) return false
      if (!matchesProgress(prog, isDone(o.id))) return false
      if (type !== 'all' && openingType(o.moves) !== type) return false
      if (needle && !`${o.name} ${o.en} ${o.eco}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [q, side, level, prog, type, isDone])

  return (
    <>
      <FilterCard q={q} setQ={setQ} shown={filtered.length} total={OPENINGS.length} active={[side, level, prog, type].filter((v) => v !== 'all').length}>
        <ChipRow label={t('lb.playAsLabel')} options={colorOpts(t)} value={side} onChange={setSide} />
        <ChipRow label={t('lb.levelLabel')} options={levelOpts(t)} value={level} onChange={setLevel} />
        <ChipRow label={t('lb.typeLabel')} options={typeOpts(t)} value={type} onChange={setType} />
        <ChipRow label={t('lb.progLabel')} options={progressOpts(t)} value={prog} onChange={setProg} />
      </FilterCard>
      <section aria-label={t('lb.openAria')}>
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{t('lb.emptyOpen')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o0) => {
              const o = lo(o0)
              const { fens } = replay(START_FEN, o.moves)
              return (
                <li key={o.id}>
                  <Link href={`/openings/${o.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={o.side === 'b'} label={t('lb.lastPosLabel', { name: o.name })} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{o.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{o.en} • {o.eco}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{o.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDone(o.id) && <Badge tone="emerald">{t('lb.doneBadge')}</Badge>}
                        <Badge tone={o.level === 'سهل' ? 'emerald' : o.level === 'متوسط' ? 'gold' : 'danger'}>{levelSlug(o.level) ? t(`pz.level${levelSlug(o.level)}`) : o.level}</Badge>
                        <Badge tone="muted">{t(TYPE_KEYS[openingType(o.moves)] ?? 'lb.typeOpen')}</Badge>
                        <Badge tone="muted">{t('lb.movesBadge', { n: o.moves.filter((_, i) => i % 2 === 0).length })}</Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
