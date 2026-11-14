'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAMES } from '../data/games'
import { replay, START_FEN } from '../lib/chess'
import { play } from '../lib/sound'
import ChessBoard from './ChessBoard'
import GuessTheMove from './GuessTheMove'
import MoveControls from './MoveControls'

/** غلاف الدور: وضع المشاهدة أو وضع «خمّن النقلة». */
export default function GameViewer({ gameId }: { gameId: string }) {
  const [mode, setMode] = useState<'watch' | 'guess'>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'guess' ? 'guess' : 'watch',
  )
  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1 text-sm" role="tablist" aria-label="وضع العرض">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'watch'}
          onClick={() => setMode('watch')}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${mode === 'watch' ? 'bg-gold text-[#1a1408]' : 'text-muted hover:text-ink'}`}
        >
          مشاهدة
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'guess'}
          onClick={() => setMode('guess')}
          className={`rounded-lg px-4 py-1.5 font-bold transition ${mode === 'guess' ? 'bg-gold text-[#1a1408]' : 'text-muted hover:text-ink'}`}
        >
          خمّن النقلة
        </button>
      </div>
      {mode === 'guess' ? <GuessTheMove gameId={gameId} /> : <ReplayViewer gameId={gameId} />}
    </div>
  )
}

function ReplayViewer({ gameId }: { gameId: string }) {
  const g = GAMES.find((x) => x.id === gameId)!
  const { fens, history } = useMemo(() => replay(START_FEN, g.moves), [g])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)
  const n = g.moves.length

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
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.key === 'ArrowRight') go(ply + 1)
      if (e.key === 'ArrowLeft') go(ply - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ply])

  const last = ply > 0 ? history[ply - 1] : null
  const note = ply > 0 ? g.notes[ply - 1] : 'اضغط "اللي بعده" أو شغّل العرض عشان تشوف الدور نقلة بنقلة.'

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="min-w-0">
        <ChessBoard
          fen={fens[ply]}
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
          playLabel={auto ? 'وقّف' : ply === n ? 'من الأول' : 'عرض'}
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
          {ply === n && (
            <p className="mt-2 border-t border-line pt-2 text-sm font-bold text-emerald">
              النتيجة: {g.result === '1-0' ? 'كسب الأبيض' : g.result === '0-1' ? 'كسب الأسود' : 'تعادل'} {g.result}
            </p>
          )}
        </div>
        <ol dir="ltr" className="flex flex-wrap gap-1 text-sm" aria-label="النقلات">
          {g.moves.map((m, i) => (
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
