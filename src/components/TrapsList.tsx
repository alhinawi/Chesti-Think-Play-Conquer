'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge } from './ui'
import { MiniBoard } from './MiniBoard'
import { ChipRow, usePersisted, FilterCard, FilterSelect, levelOpts, matchesProgress, progressOpts, sideOpts, useDone } from './LibraryFilters'
import { TRAPS } from '../data/traps'
import { FAMOUS_TRAPS } from '../data/trap-famous'
import { TRAP_STRENGTH } from '../data/trap-strength'
import { replay, START_FEN } from '../lib/chess'
import { levelSlug } from '../lib/i18n/dataLabels'
import { useTrapLoc } from '../lib/i18n/content'
import { useI18n } from '../lib/i18n'

const lenOpts = (t: (k: string) => string) => [
  { v: 'all', label: t('lb.lenAll') },
  { v: 'short', label: t('lb.lenShort') },
  { v: 'mid', label: t('lb.lenMid') },
  { v: 'long', label: t('lb.lenLong') },
]

function lenBucket(plies: number) {
  const moves = Math.ceil(plies / 2)
  return moves <= 5 ? 'short' : moves <= 8 ? 'mid' : 'long'
}

export default function TrapsList() {
  const { t: i18n } = useI18n()
  const lt = useTrapLoc()
  const [q, setQ] = usePersisted('traps', 'q', '')
  const [side, setSide] = usePersisted('traps', 'side', 'all')
  const [level, setLevel] = usePersisted('traps', 'level', 'all')
  const [prog, setProg] = usePersisted('traps', 'prog', 'all')
  const [opening, setOpening] = usePersisted('traps', 'opening', 'all')
  const [len, setLen] = usePersisted('traps', 'len', 'all')
  const [fam, setFam] = usePersisted('traps', 'fam', 'all')
  const [end, setEnd] = usePersisted('traps', 'end', 'all')
  const [limit, setLimit] = useState(60)
  const isDone = useDone('traps')

  const openingOpts = [{ v: 'all', label: i18n('lb.openingsAll') }, ...[...new Set(TRAPS.map((x) => x.opening))].sort().map((o) => ({ v: o, label: lt(TRAPS.find((x) => x.opening === o)!).opening }))]

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const rank = (id: string) => {
      const i = FAMOUS_TRAPS.indexOf(id)
      return i < 0 ? 999 : i
    }
    return [...TRAPS]
      .sort((a, b) => {
        if (fam === 'top' && rank(a.id) !== rank(b.id)) return rank(a.id) - rank(b.id)
        const sa = TRAP_STRENGTH[a.id] ?? { mate: false, material: 0, plies: 99 }
        const sb = TRAP_STRENGTH[b.id] ?? { mate: false, material: 0, plies: 99 }
        return Number(sb.mate) - Number(sa.mate) || sb.material - sa.material || sa.plies - sb.plies
      })
      .filter((t) => {
        if (end === 'mate' && !TRAP_STRENGTH[t.id]?.mate) return false
        if (side !== 'all' && t.side !== side) return false
        if (level !== 'all' && t.level !== level) return false
        if (!matchesProgress(prog, isDone(t.id))) return false
        if (opening !== 'all' && t.opening !== opening) return false
        if (len !== 'all' && lenBucket(t.moves.length) !== len) return false
        if (needle && !`${t.name} ${t.en} ${t.opening}`.toLowerCase().includes(needle)) return false
        return true
      })
  }, [q, side, level, prog, opening, len, fam, end, isDone])

  return (
    <>
      <FilterCard q={q} setQ={setQ} shown={filtered.length} total={TRAPS.length} active={[side, level, prog, opening, len, end].filter((v) => v !== 'all').length}>
        <ChipRow label={i18n('lb.famLabel')} options={[{ v: 'all', label: i18n('lb.famAll') }, { v: 'top', label: i18n('lb.famTop') }]} value={fam} onChange={setFam} />
        <ChipRow label={i18n('lb.endLabel')} options={[{ v: 'all', label: i18n('lb.endAll') }, { v: 'mate', label: i18n('lb.endMate') }]} value={end} onChange={setEnd} />
        <ChipRow label={i18n('lb.setByLabel')} options={sideOpts(i18n)} value={side} onChange={setSide} />
        <ChipRow label={i18n('lb.levelLabel')} options={levelOpts(i18n)} value={level} onChange={setLevel} />
        <ChipRow label={i18n('lb.progLabel')} options={progressOpts(i18n)} value={prog} onChange={setProg} />
        <div className="flex flex-wrap gap-4">
          <FilterSelect label={i18n('lb.openingLabel')} options={openingOpts} value={opening} onChange={setOpening} />
          <FilterSelect label={i18n('lb.moveCountLabel')} options={lenOpts(i18n)} value={len} onChange={setLen} />
        </div>
      </FilterCard>
      <section aria-label={i18n('lb.trapsAria')}>
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{i18n('lb.emptyTraps')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, limit).map((t0) => {
              const t = lt(t0)
              const { fens } = replay(START_FEN, t.moves)
              return (
                <li key={t.id}>
                  <Link href={`/traps/${t.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={t.side === 'b'} label={i18n('lb.lastPosLabel', { name: t.name })} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{t.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{t.en}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDone(t.id) && <Badge tone="emerald">{i18n('lb.doneBadge')}</Badge>}
                        {TRAP_STRENGTH[t.id]?.mate ? (
                          <Badge tone="danger">{i18n('lb.mateBadge')}</Badge>
                        ) : (
                          <Badge tone="gold">{i18n('lb.materialBadge', { n: TRAP_STRENGTH[t.id]?.material ?? 0 })}</Badge>
                        )}
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>{i18n('lb.setByBadge', { side: t.side === 'w' ? i18n('lb.sideW') : i18n('lb.sideB') })}</Badge>
                        <Badge tone="muted">{levelSlug(t.level) ? i18n(`pz.level${levelSlug(t.level)}`) : t.level}</Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {filtered.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((n) => n + 60)}
            className="mx-auto mt-6 block rounded-full border border-gold/50 px-6 py-2.5 text-sm font-bold text-gold transition hover:bg-gold/10"
          >
            {i18n('lb.showMoreTraps', { n: filtered.length - limit })}
          </button>
        )}
      </section>
    </>
  )
}
