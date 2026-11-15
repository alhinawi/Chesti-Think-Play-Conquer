'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ChipRow, FilterCard, LEVEL_OPTS, matchesProgress, PROGRESS_OPTS, useDone } from './LibraryFilters'
import { OPENINGS } from '../data/openings'
import { replay, START_FEN } from '../lib/chess'

const COLOR_OPTS = [
  { v: 'all', label: 'الكل' },
  { v: 'w', label: 'للأبيض' },
  { v: 'b', label: 'للأسود' },
]
const TYPE_OPTS = [
  { v: 'all', label: 'كل الأنواع' },
  { v: 'open', label: 'مفتوحة (e4 e5)' },
  { v: 'semi', label: 'نص مفتوحة' },
  { v: 'closed', label: 'مغلقة (d4)' },
  { v: 'flank', label: 'جانبية' },
]

/** classify from the first moves: e4+e5 open, e4 other semi-open, d4 closed, anything else flank */
export function openingType(moves: string[]): 'open' | 'semi' | 'closed' | 'flank' {
  if (moves[0] === 'e4') return moves[1] === 'e5' ? 'open' : 'semi'
  if (moves[0] === 'd4') return 'closed'
  return 'flank'
}
const TYPE_LABEL: Record<string, string> = { open: 'مفتوحة', semi: 'نص مفتوحة', closed: 'مغلقة', flank: 'جانبية' }

export default function OpeningsList() {
  const [q, setQ] = useState('')
  const [side, setSide] = useState('all')
  const [level, setLevel] = useState('all')
  const [prog, setProg] = useState('all')
  const [type, setType] = useState('all')
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
        <ChipRow label="بتلعب" options={COLOR_OPTS} value={side} onChange={setSide} />
        <ChipRow label="المستوى" options={LEVEL_OPTS} value={level} onChange={setLevel} />
        <ChipRow label="النوع" options={TYPE_OPTS} value={type} onChange={setType} />
        <ChipRow label="التقدم" options={PROGRESS_OPTS} value={prog} onChange={setProg} />
      </FilterCard>
      <section aria-label="كل الافتتاحيات">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">مفيش افتتاحيات مطابقة للفلاتر دي. جرّب توسّع البحث.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => {
              const { fens } = replay(START_FEN, o.moves)
              return (
                <li key={o.id}>
                  <Link href={`/openings/${o.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={o.side === 'b'} label={`الوضع الأخير في ${o.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{o.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{o.en} • {o.eco}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{o.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDone(o.id) && <Badge tone="emerald">خلصته ✓</Badge>}
                        <Badge tone={o.level === 'سهل' ? 'emerald' : o.level === 'متوسط' ? 'gold' : 'danger'}>{o.level}</Badge>
                        <Badge tone="muted">{TYPE_LABEL[openingType(o.moves)]}</Badge>
                        <Badge tone="muted">{o.moves.filter((_, i) => i % 2 === 0).length} نقلة</Badge>
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
