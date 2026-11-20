'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { OPENINGS } from '../data/openings'
import { useI18n } from '../lib/i18n'
import { useOpeningLoc } from '../lib/i18n/content'
import { replay, START_FEN } from '../lib/chess'
import { play } from '../lib/sound'
import { markDone } from '../lib/progress'
import ChessBoard from './ChessBoard'
import MoveControls from './MoveControls'

export default function OpeningViewer({ openingId }: { openingId: string }) {
  const { locale } = useI18n()
  const en = locale === 'en'
  const lo = useOpeningLoc()
  const o = lo(OPENINGS.find((x) => x.id === openingId)!)
  const { fens, history } = useMemo(() => replay(START_FEN, o.moves), [o.moves])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)
  const n = o.moves.length

  const go = useCallback(
    (k: number) => {
      const target = Math.max(0, Math.min(n, k))
      setPly((cur) => {
        if (target === cur + 1) {
          const mv = history[cur]
          play(mv.san.includes('#') ? 'end' : mv.san.includes('+') ? 'check' : mv.captured ? 'capture' : 'move')
        }
        return target
      })
    },
    [n, history],
  )

  useEffect(() => {
    if (!auto) return
    if (ply >= n) {
      setAuto(false)
      return
    }
    const id = setTimeout(() => go(ply + 1), 1100)
    return () => clearTimeout(id)
  }, [auto, ply, n, go])

  useEffect(() => {
    if (ply === n) markDone('openings', o.id)
  }, [ply, n, o.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.key === 'ArrowRight') go(ply + 1)
      if (e.key === 'ArrowLeft') go(ply - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ply])

  const last = ply > 0 ? history[ply - 1] : null
  const note = ply > 0 ? o.notes[ply - 1] : (en ? 'Press "Next" or start the show to see the main line move by move.' : 'اضغط "اللي بعده" أو شغّل العرض عشان تشوف الخط الرئيسي نقلة بنقلة.')

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="sticky top-14 z-20 mx-auto -mt-2 w-full min-w-0 max-w-[min(100%,calc(100svh-11rem))] bg-bg pb-2 pt-2 lg:static lg:mt-0 lg:max-w-none lg:bg-transparent lg:p-0">
        <ChessBoard
          fen={fens[ply]}
          movable={false}
          orientation={o.side === 'b' ? 'black' : 'white'}
          lastMove={last ? [last.from, last.to] : null}
        />
        <MoveControls
          className="mt-3"
          ply={ply}
          total={n}
          go={go}
          auto={auto}
          onToggle={() => (ply >= n && !auto ? (setPly(0), setAuto(true)) : setAuto((a) => !a))}
          playLabel={en ? (auto ? 'Stop' : ply === n ? 'Restart' : 'Play') : auto ? 'وقّف' : ply === n ? 'من الأول' : 'عرض'}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div className="min-h-28 rounded-2xl border border-line bg-surface p-4" aria-live="polite">
          {last && (
            <p dir="ltr" className="mb-1 text-start font-mono text-lg font-bold text-gold">
              {Math.floor((ply - 1) / 2) + 1}.{(ply - 1) % 2 ? '..' : ''} {last.san}
            </p>
          )}
          <p>{note || ' '}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-1 text-sm font-bold text-gold">{en ? "White's plan" : 'خطة الأبيض'}</h3>
            <p className="text-sm text-muted">{o.planW}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="mb-1 text-sm font-bold text-emerald">{en ? "Black's plan" : 'خطة الأسود'}</h3>
            <p className="text-sm text-muted">{o.planB}</p>
          </div>
        </div>
        <ol dir="ltr" className="flex flex-wrap gap-1 text-sm" aria-label={en ? 'Moves' : 'النقلات'}>
          {o.moves.map((m, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPly(i + 1)}
                aria-current={ply === i + 1 ? 'step' : undefined}
                className={`rounded px-1.5 py-0.5 font-mono ${ply === i + 1 ? 'bg-gold text-[#1a1408]' : 'text-muted hover:bg-surface-2'}`}
              >
                {i % 2 === 0 ? `${i / 2 + 1}.` : ''}{m}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
