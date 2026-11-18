'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TRAPS } from '../data/traps'
import type { Trap } from '../data/types'
import { replay, START_FEN, tryMove, type UciMove } from '../lib/chess'
import { play } from '../lib/sound'
import { markDone } from '../lib/progress'
import ChessBoard from './ChessBoard'
import RichText from './RichText'
import MoveControls from './MoveControls'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'
import { useTrapLoc } from '../lib/i18n/content'

export default function TrapViewer({ trapId, items, bucket }: { trapId: string; items?: Trap[]; bucket?: 'traps' | 'miniatures' }) {
  const en = useI18n().locale === 'en'
  const lt = useTrapLoc()
  const t = lt((items ?? TRAPS).find((x) => x.id === trapId)!)
  const { fens, history } = useMemo(() => replay(START_FEN, t.moves), [t.moves])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)
  const [practice, setPractice] = useState(false)
  const [wrong, setWrong] = useState(0)
  const [hint, setHint] = useState(false)
  const [missed, setMissed] = useState(false)
  const n = t.moves.length
  const myParity = t.side === 'w' ? 0 : 1
  const myTurn = practice && ply < n && ply % 2 === myParity
  const next = ply < n ? tryMove(fens[ply], t.moves[ply])?.move : null

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

  // practice: the opponent's moves from the line are played for you
  useEffect(() => {
    if (!practice || ply >= n || ply % 2 === myParity) return
    const id = setTimeout(() => go(ply + 1), 800)
    return () => clearTimeout(id)
  }, [practice, ply, n, myParity, go])

  const startPractice = () => {
    setAuto(false)
    setPly(0)
    setWrong(0)
    setMissed(false)
    setHint(false)
    setPractice(true)
  }
  const stopPractice = () => {
    setPractice(false)
    setHint(false)
    setPly(0)
  }
  const onMove = (m: UciMove) => {
    const r = tryMove(fens[ply], m)
    if (!r || r.move.san !== t.moves[ply]) {
      setWrong((w) => w + 1)
      setMissed(true)
      return false
    }
    setHint(false)
    setMissed(false)
    go(ply + 1)
    return true
  }

  useEffect(() => {
    if (ply === n) markDone(bucket ?? 'traps', t.id)
  }, [ply, n, t.id, bucket])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select') || practice) return
      // the move buttons read left to right, so the arrow keys follow them
      if (e.key === 'ArrowRight') go(ply + 1)
      if (e.key === 'ArrowLeft') go(ply - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, ply, practice])

  const last = ply > 0 ? history[ply - 1] : null
  const note = ply > 0 ? t.notes[ply - 1] : practice ? '' : (en ? 'Press "Next" or start the show to see the trap move by move.' : 'اضغط "اللي بعده" أو شغّل العرض عشان تشوف الفخ نقلة بنقلة.')
  const isMistake = ply - 1 === t.mistake
  const prompt = practice
    ? ply >= n
      ? en ? 'You pulled it off. That is the whole trap.' : 'نفّذت الفخ لحد الآخر. ده الفخ كله.'
      : myTurn
        ? missed
          ? en ? 'Not the trap move. Try again, or press Hint.' : 'دي مش نقلة الفخ. جرّب تاني أو دوس تلميح.'
          : en ? `Your move: play the ${t.side === 'w' ? 'white' : 'black'} pieces and set the trap.` : `دورك: العب بالـ${t.side === 'w' ? 'أبيض' : 'أسود'} ونفّذ الفخ.`
        : en ? 'Your opponent is moving...' : 'الخصم بيلعب...'
    : null

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div className="min-w-0">
        <ChessBoard
          fen={fens[ply]}
          movable={myTurn ? t.side : false}
          onMove={myTurn ? onMove : undefined}
          shake={wrong}
          arrows={myTurn && hint && next ? [{ from: next.from, to: next.to, color: 'green' }] : undefined}
          orientation={t.side === 'b' ? 'black' : 'white'}
          lastMove={last ? [last.from, last.to] : null}
          marks={isMistake && last ? { [last.to]: 'bad' } : undefined}
        />
        {!practice && <MoveControls
          className="mt-3"
          ply={ply}
          total={n}
          go={go}
          auto={auto}
          onToggle={() => (ply >= n && !auto ? (setPly(0), setAuto(true)) : setAuto((a) => !a))}
          playLabel={en ? (auto ? 'Stop' : ply === n ? 'Restart' : 'Play') : auto ? 'وقّف' : ply === n ? 'من الأول' : 'عرض'}
        />}
      </div>
      <div className="flex flex-col gap-4">
        <div className={`min-h-28 rounded-2xl border p-4 ${isMistake ? 'border-danger/50 bg-danger/10' : 'border-line bg-surface'}`} aria-live="polite">
          {last && (
            <p dir="ltr" className="mb-1 text-start font-mono text-lg font-bold text-gold">
              {Math.floor((ply - 1) / 2) + 1}.{(ply - 1) % 2 ? '..' : ''} {last.san}
            </p>
          )}
          {isMistake && <p className="mb-1 text-sm font-bold text-danger">{en ? 'The fatal mistake' : 'الغلطة القاتلة'}</p>}
          {prompt && <p className="mb-1 font-bold text-gold">{prompt}</p>}
          {note ? <RichText text={note} /> : <p> </p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {practice ? (
            <>
              <Button onClick={startPractice}>{en ? 'Restart' : 'من الأول'}</Button>
              <Button variant="soft" disabled={!myTurn} onClick={() => setHint(true)}>{en ? 'Hint' : 'تلميح'}</Button>
              <Button variant="soft" onClick={stopPractice}>{en ? 'Back to watching' : 'ارجع للعرض'}</Button>
            </>
          ) : (
            <>
              <Button onClick={startPractice}>{en ? 'Practice it yourself' : 'جرّب الفخ بنفسك'}</Button>
              <Button variant="soft" onClick={() => go(t.mistake + 1)}>{en ? 'Show me the mistake' : 'ورّيني الغلطة'}</Button>
            </>
          )}
        </div>
        {!practice && <ol dir="ltr" className="flex flex-wrap gap-1 text-sm" aria-label={en ? 'Moves' : 'النقلات'}>
          {t.moves.map((m, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPly(i + 1)}
                aria-current={ply === i + 1 ? 'step' : undefined}
                className={`rounded px-1.5 py-0.5 font-mono ${ply === i + 1 ? 'bg-gold text-[#1a1408]' : i === t.mistake ? 'text-danger hover:bg-surface-2' : 'text-muted hover:bg-surface-2'}`}
              >
                {i % 2 === 0 ? `${i / 2 + 1}.` : ''}{m}
              </button>
            </li>
          ))}
        </ol>}
      </div>
    </div>
  )
}
