'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ChipRow, FilterCard, FilterSelect, LEVEL_OPTS, matchesProgress, PROGRESS_OPTS, useDone } from './LibraryFilters'
import { MINIATURES } from '../data/miniatures'
import { replay, START_FEN } from '../lib/chess'

const WINNER_OPTS = [
  { v: 'all', label: 'الكل' },
  { v: 'w', label: 'كسب الأبيض' },
  { v: 'b', label: 'كسب الأسود' },
]
const MATE_OPTS = [
  { v: 'all', label: 'كل الأطوال' },
  { v: '6-8', label: 'مات في 6-8' },
  { v: '9-11', label: 'مات في 9-11' },
  { v: '12+', label: 'مات في 12+' },
]

function mateBucket(plies: number) {
  const moves = Math.ceil(plies / 2)
  return moves <= 8 ? '6-8' : moves <= 11 ? '9-11' : '12+'
}

export default function MiniaturesList() {
  const [q, setQ] = useState('')
  const [winner, setWinner] = useState('all')
  const [level, setLevel] = useState('all')
  const [prog, setProg] = useState('all')
  const [mate, setMate] = useState('all')
  const isDone = useDone('miniatures')

  const openingOpts = useMemo(
    () => [{ v: 'all', label: 'كل الافتتاحيات' }, ...[...new Set(MINIATURES.map((t) => t.opening))].sort().map((o) => ({ v: o, label: o }))],
    [],
  )
  const [opening, setOpening] = useState('all')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...MINIATURES]
      .sort((a, b) => a.moves.length - b.moves.length)
      .filter((t) => {
        if (winner !== 'all' && t.side !== winner) return false
        if (level !== 'all' && t.level !== level) return false
        if (!matchesProgress(prog, isDone(t.id))) return false
        if (mate !== 'all' && mateBucket(t.moves.length) !== mate) return false
        if (opening !== 'all' && t.opening !== opening) return false
        if (needle && !`${t.name} ${t.en} ${t.opening} ${t.white} ${t.black}`.toLowerCase().includes(needle)) return false
        return true
      })
  }, [q, winner, level, prog, mate, opening, isDone])

  return (
    <>
      <FilterCard q={q} setQ={setQ} shown={filtered.length} total={MINIATURES.length}>
        <ChipRow label="الفائز" options={WINNER_OPTS} value={winner} onChange={setWinner} />
        <ChipRow label="المستوى" options={LEVEL_OPTS} value={level} onChange={setLevel} />
        <ChipRow label="التقدم" options={PROGRESS_OPTS} value={prog} onChange={setProg} />
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="عدد نقلات المات" options={MATE_OPTS} value={mate} onChange={setMate} />
          <FilterSelect label="الافتتاحية" options={openingOpts} value={opening} onChange={setOpening} />
        </div>
      </FilterCard>
      <section aria-label="كل الماتشات الخاطفة">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">مفيش ماتشات مطابقة للفلاتر دي. جرّب توسّع البحث.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const { fens } = replay(START_FEN, t.moves)
              return (
                <li key={t.id}>
                  <Link href={`/miniatures/${t.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={t.side === 'b'} label={`وضع المات في ${t.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{t.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{t.en}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDone(t.id) && <Badge tone="emerald">خلصته ✓</Badge>}
                        <Badge tone="danger">مات في {Math.ceil(t.moves.length / 2)}</Badge>
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>كسب {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
                        <Badge tone="muted">{t.level}</Badge>
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
