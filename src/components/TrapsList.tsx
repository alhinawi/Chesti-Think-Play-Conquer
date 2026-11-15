'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ChipRow, FilterCard, FilterSelect, LEVEL_OPTS, matchesProgress, PROGRESS_OPTS, SIDE_OPTS, useDone } from './LibraryFilters'
import { TRAPS } from '../data/traps'
import { TRAP_STRENGTH } from '../data/trap-strength'
import { replay, START_FEN } from '../lib/chess'

const LEN_OPTS = [
  { v: 'all', label: 'كل الأطوال' },
  { v: 'short', label: 'قصير (5 نقلات وأقل)' },
  { v: 'mid', label: 'متوسط (6-8)' },
  { v: 'long', label: 'طويل (9+)' },
]

function lenBucket(plies: number) {
  const moves = Math.ceil(plies / 2)
  return moves <= 5 ? 'short' : moves <= 8 ? 'mid' : 'long'
}

export default function TrapsList() {
  const [q, setQ] = useState('')
  const [side, setSide] = useState('all')
  const [level, setLevel] = useState('all')
  const [prog, setProg] = useState('all')
  const [opening, setOpening] = useState('all')
  const [len, setLen] = useState('all')
  const isDone = useDone('traps')

  const openingOpts = useMemo(
    () => [{ v: 'all', label: 'كل الافتتاحيات' }, ...[...new Set(TRAPS.map((t) => t.opening))].sort().map((o) => ({ v: o, label: o }))],
    [],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...TRAPS]
      .sort((a, b) => {
        const sa = TRAP_STRENGTH[a.id] ?? { mate: false, material: 0, plies: 99 }
        const sb = TRAP_STRENGTH[b.id] ?? { mate: false, material: 0, plies: 99 }
        return Number(sb.mate) - Number(sa.mate) || sb.material - sa.material || sa.plies - sb.plies
      })
      .filter((t) => {
        if (side !== 'all' && t.side !== side) return false
        if (level !== 'all' && t.level !== level) return false
        if (!matchesProgress(prog, isDone(t.id))) return false
        if (opening !== 'all' && t.opening !== opening) return false
        if (len !== 'all' && lenBucket(t.moves.length) !== len) return false
        if (needle && !`${t.name} ${t.en} ${t.opening}`.toLowerCase().includes(needle)) return false
        return true
      })
  }, [q, side, level, prog, opening, len, isDone])

  return (
    <>
      <FilterCard q={q} setQ={setQ} shown={filtered.length} total={TRAPS.length}>
        <ChipRow label="بينصبه" options={SIDE_OPTS} value={side} onChange={setSide} />
        <ChipRow label="المستوى" options={LEVEL_OPTS} value={level} onChange={setLevel} />
        <ChipRow label="التقدم" options={PROGRESS_OPTS} value={prog} onChange={setProg} />
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="الافتتاحية" options={openingOpts} value={opening} onChange={setOpening} />
          <FilterSelect label="عدد النقلات" options={LEN_OPTS} value={len} onChange={setLen} />
        </div>
      </FilterCard>
      <section aria-label="كل الفخاخ مرتبة بالقوة">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">مفيش فخاخ مطابقة للفلاتر دي. جرّب توسّع البحث.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const { fens } = replay(START_FEN, t.moves)
              return (
                <li key={t.id}>
                  <Link href={`/traps/${t.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={t.side === 'b'} label={`الوضع الأخير في ${t.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{t.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{t.en}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDone(t.id) && <Badge tone="emerald">خلصته ✓</Badge>}
                        {TRAP_STRENGTH[t.id]?.mate ? (
                          <Badge tone="danger">كش مات</Badge>
                        ) : (
                          <Badge tone="gold">+{TRAP_STRENGTH[t.id]?.material ?? 0} مادة</Badge>
                        )}
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>بينصبه {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
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
