'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { replay, START_FEN } from '../lib/chess'
import { play } from '../lib/sound'
import ChessBoard from './ChessBoard'
import MoveControls from './MoveControls'
import { Badge, PageHeader } from './ui'
import { useI18n } from '../lib/i18n'
import ECO from '../data/eco-openings.json'

type Row = [string, string, string] // [eco, name, pgn]
const ROWS = ECO as Row[]

const LETTERS = ['all', 'A', 'B', 'C', 'D', 'E'] as const
const PAGE = 150

function pgnToMoves(pgn: string): string[] {
  return pgn
    .replace(/\d+\.(\.\.)?/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export default function OpeningsExplorer() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [letter, setLetter] = useState<(typeof LETTERS)[number]>('all')
  const [shown, setShown] = useState(PAGE)
  const [sel, setSel] = useState<Row | null>(null)
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ROWS.length }
    for (const l of ['A', 'B', 'C', 'D', 'E']) c[l] = 0
    for (const r of ROWS) c[r[0][0]]++
    return c
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return ROWS.filter(
      (r) =>
        (letter === 'all' || r[0][0] === letter) &&
        (!needle || r[1].toLowerCase().includes(needle) || r[0].toLowerCase().includes(needle)),
    )
  }, [q, letter])

  useEffect(() => setShown(PAGE), [q, letter])

  const parsed = useMemo(() => {
    if (!sel) return null
    return replay(START_FEN, pgnToMoves(sel[2]))
  }, [sel])

  const n = parsed ? parsed.fens.length - 1 : 0

  const pick = (r: Row) => {
    setSel(r)
    setPly(0)
    setAuto(false)
  }

  const go = useCallback(
    (k: number) => {
      if (!parsed) return
      const target = Math.max(0, Math.min(n, k))
      setPly((cur) => {
        if (target === cur + 1) {
          const mv = parsed.history[cur]
          play(mv.san.includes('#') ? 'end' : mv.san.includes('+') ? 'check' : mv.captured ? 'capture' : 'move')
        }
        return target
      })
    },
    [n, parsed],
  )

  useEffect(() => {
    if (!auto) return
    if (ply >= n) {
      setAuto(false)
      return
    }
    const id = setTimeout(() => go(ply + 1), 900)
    return () => clearTimeout(id)
  }, [auto, ply, n, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.key === 'ArrowRight') go(ply + 1)
      if (e.key === 'ArrowLeft') go(ply - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ply])

  const last = parsed && ply > 0 ? parsed.history[ply - 1] : null

  return (
    <>
      <PageHeader kicker={t('oe.kicker')} title={t('oe.title')} desc={t('oe.desc', { n: ROWS.length.toLocaleString('en') })} />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,460px)]">
        {/* الفلاتر والقايمة */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('oe.searchPh')}
              className="w-full max-w-sm rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-gold/60"
              aria-label={t('oe.searchAria')}
            />
            <span className="text-xs text-muted">{t('oe.resultsCount', { n: filtered.length.toLocaleString('en') })}</span>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label={t('oe.filterAria')}>
            {LETTERS.map((l) => (
              <button
                key={l}
                role="tab"
                aria-selected={letter === l}
                onClick={() => setLetter(l)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  letter === l ? 'border-gold bg-gold/15 text-gold' : 'border-line bg-surface text-muted hover:border-gold/40'
                }`}
              >
                {t(l === 'all' ? 'oe.letterAll' : `oe.letter${l}`)} <span dir="ltr">({counts[l]?.toLocaleString('en')})</span>
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-1 gap-1.5">
            {filtered.slice(0, shown).map((r) => {
              const active = sel === r
              return (
                <li key={`${r[0]}|${r[1]}|${r[2]}`}>
                  <button
                    onClick={() => pick(r)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition ${
                      active ? 'border-gold bg-gold/10' : 'border-line bg-surface hover:border-gold/40'
                    }`}
                  >
                    <span className="w-11 shrink-0 font-mono text-xs font-bold text-gold" dir="ltr">
                      {r[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold" dir="ltr">
                        {r[1]}
                      </span>
                      <span className="block truncate text-xs text-muted" dir="ltr">
                        {r[2]}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {shown < filtered.length && (
            <button
              onClick={() => setShown((s) => s + PAGE)}
              className="mt-3 w-full rounded-xl border border-line bg-surface py-2 text-sm text-muted transition hover:border-gold/40 hover:text-gold"
            >
              {t('oe.showMore', { n: (filtered.length - shown).toLocaleString('en') })}
            </button>
          )}
        </div>

        {/* الرقعة */}
        <div className="order-first lg:order-none lg:sticky lg:top-4">
          {sel && parsed ? (
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="gold">{sel[0]}</Badge>
                <h2 className="text-sm font-bold" dir="ltr">
                  {sel[1]}
                </h2>
              </div>
              <ChessBoard
                fen={parsed.fens[ply]}
                movable={false}
                orientation="white"
                lastMove={last ? [last.from, last.to] : null}
              />
              <MoveControls
                className="mt-3"
                ply={ply}
                total={n}
                go={go}
                auto={auto}
                onToggle={() => (ply >= n && !auto ? (setPly(0), setAuto(true)) : setAuto((a) => !a))}
                playLabel={auto ? t('oe.stop') : ply === n ? t('oe.fromStart') : t('oe.playBtn')}
              />
              <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
                <p className="text-xs leading-relaxed text-muted" dir="ltr">
                  {sel[2]}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {ply === n ? t('oe.lineEnd') : t('oe.progressNote', { ply, n })}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center text-sm text-muted">
              {t('oe.emptyBoard')}
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-muted">
        {t('oe.creditPre')}
        <a href="https://github.com/lichess-org/chess-openings" target="_blank" rel="noreferrer" className="underline hover:text-gold" dir="ltr">
          lichess chess-openings
        </a>{' '}
        {t('oe.creditMid')}
        <a href="/openings" className="underline hover:text-gold">
          {t('oe.creditLink')}
        </a>
        .
      </p>
    </>
  )
}
