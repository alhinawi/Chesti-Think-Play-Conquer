'use client'

import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import ChessBoard from './ChessBoard'
import { Badge } from './ui'
import { Engine } from '../lib/engine'
import { useI18n } from '../lib/i18n'
import { classifyMove, toCp, type MoveClass } from '../lib/game'

interface Row {
  ply: number
  fen: string
  played: string
  playedSan: string
  best: string
  bestSan: string
  cls: MoveClass
  loss: number
}

const TONE: Record<MoveClass, 'danger' | 'gold' | 'muted' | 'emerald'> = { blunder: 'danger', mistake: 'gold', inaccuracy: 'muted', good: 'emerald' }

function sanOf(fen: string, uci: string) {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
  } catch {
    return uci
  }
}

/** Post-game review: Stockfish checks every move the user made and points out the costly ones. */
export default function Analysis({ moves, userColor }: { moves: string[]; userColor: 'w' | 'b' }) {
  const { t } = useI18n()
  const clsName = (c: MoveClass) => t(`an.cls${c.charAt(0).toUpperCase()}${c.slice(1)}`)
  const [rows, setRows] = useState<Row[]>([])
  const [done, setDone] = useState(0)
  const [failed, setFailed] = useState(false)
  const [pick, setPick] = useState<number | null>(null)

  const positions = useMemo(() => {
    const g = new Chess()
    const out: { fen: string; uci: string; color: 'w' | 'b' }[] = []
    for (const m of moves) {
      const fen = g.fen()
      const color = g.turn()
      try {
        g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] })
      } catch {
        break
      }
      out.push({ fen, uci: m, color })
    }
    out.push({ fen: g.fen(), uci: '', color: g.turn() })
    return out
  }, [moves])

  const userPlies = useMemo(() => positions.map((_, i) => i).filter((i) => i < positions.length - 1 && positions[i].color === userColor), [positions, userColor])

  useEffect(() => {
    let stop = false
    const engine = new Engine()
    engine.onError = () => setFailed(true)
    ;(async () => {
      const cache = new Map<number, { best: string; score: number }>()
      const evalAt = async (i: number) => {
        if (cache.has(i)) return cache.get(i)!
        const p = positions[i]
        const g = new Chess(p.fen)
        let r: { best: string; score: number }
        if (g.isGameOver()) r = { best: '', score: g.isCheckmate() ? -10000 : 0 }
        else {
          const { best, lines } = await engine.search(p.fen, { skill: 20, depth: 11 })
          r = { best, score: toCp(lines[0]) }
        }
        cache.set(i, r)
        return r
      }
      const out: Row[] = []
      for (const i of userPlies) {
        if (stop) return
        const before = await evalAt(i)
        const after = await evalAt(i + 1)
        const p = positions[i]
        const { cls, loss } = classifyMove(before.score, -after.score, before.best === p.uci)
        out.push({ ply: i, fen: p.fen, played: p.uci, playedSan: sanOf(p.fen, p.uci), best: before.best, bestSan: sanOf(p.fen, before.best), cls, loss })
        if (!stop) {
          setRows([...out])
          setDone(out.length)
        }
      }
    })().catch(() => setFailed(true))
    return () => {
      stop = true
      engine.terminate()
    }
  }, [positions, userPlies])

  const total = userPlies.length
  const finished = done >= total
  const bad = rows.filter((r) => r.cls !== 'good')
  const count = (c: MoveClass) => rows.filter((r) => r.cls === c).length
  const avgLoss = rows.length ? Math.round(rows.reduce((a, r) => a + Math.min(r.loss, 1000), 0) / rows.length) : 0
  const shown = pick !== null ? rows.find((r) => r.ply === pick) : undefined

  return (
    <section aria-labelledby="analysis-h" className="animate-fade-up luxe-card rounded-2xl p-4">
      <h2 id="analysis-h" className="text-lg font-bold">{t('an.title')}</h2>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-danger">{t('an.failed')}</p>
      ) : !finished ? (
        <div className="mt-3" aria-live="polite">
          <p className="text-sm text-muted">
            {t('an.reviewing')} <bdi className="ltr">{done}/{total}</bdi>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-l from-gold-2 to-gold transition-all" style={{ width: `${total ? (done / total) * 100 : 100}%` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(['blunder', 'mistake', 'inaccuracy'] as const).map((c) => (
              <div key={c} className="rounded-xl border border-line bg-surface p-2">
                <p className={`text-xl font-bold ${c === 'blunder' ? 'text-danger' : c === 'mistake' ? 'text-gold' : 'text-muted'}`}>{count(c)}</p>
                <p className="text-xs text-muted">{clsName(c)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm">
            {bad.length === 0
              ? t('an.clean')
              : t('an.avgLoss', { n: (avgLoss / 100).toFixed(1) })}
          </p>
          {bad.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {bad.map((r) => (
                <li key={r.ply}>
                  <button
                    type="button"
                    onClick={() => setPick(pick === r.ply ? null : r.ply)}
                    aria-expanded={pick === r.ply}
                    className={`flex w-full flex-wrap items-center gap-2 rounded-xl border p-2 text-start text-sm ${pick === r.ply ? 'border-gold bg-gold-soft' : 'border-line bg-surface hover:border-gold/50'}`}
                  >
                    <span className="ltr text-muted">{Math.floor(r.ply / 2) + 1}{r.ply % 2 ? '...' : '.'}</span>
                    <span className="ltr font-bold text-danger line-through decoration-1">{r.playedSan}</span>
                    <span className="text-muted">{t('an.best')}</span>
                    <span className="ltr font-bold text-emerald">{r.bestSan}</span>
                    <span className="ms-auto">
                      <Badge tone={TONE[r.cls]}>{clsName(r.cls)}</Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shown && (
            <div className="animate-fade-up mx-auto mt-3 w-full max-w-[360px]">
              <ChessBoard
                fen={shown.fen}
                movable={false}
                orientation={userColor === 'w' ? 'white' : 'black'}
                arrows={[
                  { from: shown.played.slice(0, 2), to: shown.played.slice(2, 4), color: 'red' },
                  ...(shown.best ? [{ from: shown.best.slice(0, 2), to: shown.best.slice(2, 4), color: 'green' as const }] : []),
                ]}
              />
              <p className="mt-2 text-center text-xs text-muted">{t('an.legend')}</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
