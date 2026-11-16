'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import ChessBoard, { type BoardArrow } from './ChessBoard'
import RichText from './RichText'
import MoveControls from './MoveControls'
import { Button, Icon } from './ui'
import { parseUci, replay, soundFor, START_FEN, toUci, tryMove, type UciMove } from '../lib/chess'
import { play } from '../lib/sound'
import type { Arr, ExplainStep, LineStep, Step, TaskStep } from '../data/types'
import { useI18n } from '../lib/i18n'


const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const toArrows = (a?: Arr[]): BoardArrow[] => (a ?? []).map(([from, to, color]) => ({ from, to, color }))

export function StepView({ step, onDone, done }: { step: Step; onDone: () => void; done: boolean }) {
  if (step.kind === 'explain') return <ExplainView step={step} onDone={onDone} />
  if (step.kind === 'line') return <LineViewer step={step} onDone={onDone} />
  return <TaskRunner step={step} onDone={onDone} alreadyDone={done} />
}

export function Layout2({ board, side }: { board: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-8">
      <div className="mx-auto w-full max-w-[560px]">{board}</div>
      <div className="min-w-0">{side}</div>
    </div>
  )
}

function ExplainView({ step, onDone }: { step: ExplainStep; onDone: () => void }) {
  useEffect(() => {
    onDone()
  }, [step, onDone])
  return (
    <Layout2
      board={
        <ChessBoard
          fen={step.fen ?? START_FEN}
          movable={false}
          arrows={toArrows(step.arrows)}
          highlights={step.highlights}
          orientation={step.orientation}
        />
      }
      side={<RichText text={step.text} className="text-[1.05rem]" />}
    />
  )
}

export function LineViewer({ step, onDone, compact }: { step: LineStep; onDone?: () => void; compact?: boolean }) {
  const { t } = useI18n()
  const { fens, history } = useMemo(() => replay(step.fen ?? START_FEN, step.moves), [step])
  const [ply, setPly] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    setPly(0)
    setAuto(false)
  }, [step])

  useEffect(() => {
    if (ply === step.moves.length) onDone?.()
  }, [ply, step.moves.length, onDone])

  const go = useCallback(
    (n: number) => {
      const target = Math.max(0, Math.min(step.moves.length, n))
      setPly((cur) => {
        if (target === cur + 1) {
          const g = new Chess(fens[target])
          soundFor(history[target - 1], g)
        }
        return target
      })
    },
    [fens, history, step.moves.length],
  )

  useEffect(() => {
    if (!auto) return
    if (ply >= step.moves.length) {
      setAuto(false)
      return
    }
    const t = setTimeout(() => go(ply + 1), 1100)
    return () => clearTimeout(t)
  }, [auto, ply, go, step.moves.length])

  useEffect(() => {
    // several compact viewers can share a page (encyclopedia), so only full viewers take the arrow keys
    if (compact) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      // the move buttons read left to right, so the arrow keys follow them
      if (e.key === 'ArrowRight') go(ply + 1)
      if (e.key === 'ArrowLeft') go(ply - 1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [go, ply, compact])

  const last = ply > 0 ? history[ply - 1] : null
  const note = ply > 0 ? step.notes?.[ply - 1] : undefined

  const controls = (
    <MoveControls
      className="mt-3"
      ply={ply}
      total={step.moves.length}
      go={go}
      auto={auto}
      onToggle={() => (ply >= step.moves.length && !auto ? (setPly(0), setAuto(true)) : setAuto(!auto))}
    />
  )

  const moveList = (
    <div className="ltr mt-4 flex flex-wrap gap-1 text-sm">
      {history.map((m, i) => (
        <button
          key={i}
          onClick={() => go(i + 1)}
          className={`rounded-md px-1.5 py-0.5 font-bold transition ${i + 1 === ply ? 'bg-gold text-[#1a1408]' : 'text-muted hover:bg-surface-2 hover:text-ink'} ${step.notes?.[i] ? 'underline decoration-gold/50 decoration-dotted underline-offset-4' : ''}`}
        >
          {i % 2 === 0 || i === 0 ? <span className="me-0.5 opacity-60">{Math.floor((i + (new Chess(fens[0]).turn() === 'b' ? 1 : 0)) / 2) + 1}.{i === 0 && new Chess(fens[0]).turn() === 'b' ? '..' : ''}</span> : null}
          {m.san}
        </button>
      ))}
    </div>
  )

  if (compact) {
    return (
      <div className="mx-auto w-full max-w-[420px]">
        <ChessBoard fen={fens[ply]} movable={false} lastMove={last ? [last.from, last.to] : null} orientation={step.orientation} />
        {controls}
        <div className="mt-3 min-h-12 rounded-xl border border-gold/25 bg-gold-soft px-3 py-2 text-sm" aria-live="polite">
          {ply === 0 ? <span className="text-muted">{t('ln.watchMoves')}</span> : <span className="ltr font-bold text-gold">{last?.san}</span>}
          {note && <RichText text={note} className="inline" />}
        </div>
        {moveList}
      </div>
    )
  }

  return (
    <Layout2
      board={
        <>
          <ChessBoard fen={fens[ply]} movable={false} lastMove={last ? [last.from, last.to] : null} orientation={step.orientation} />
          {controls}
        </>
      }
      side={
        <div>
          {!compact && <RichText text={step.text} className="text-[1.05rem]" />}
          <div className="mt-4 min-h-[4.5rem] rounded-xl border border-gold/25 bg-gold-soft p-4 text-[1.02rem]" aria-live="polite">
            {ply === 0 ? (
              <span className="text-muted">{t('ln.pressPlay')}</span>
            ) : (
              <>
                <span className="ltr me-2 inline-block font-bold text-gold">{last?.san}</span>
                {note ? <RichText text={note} className="inline" /> : <span className="text-muted">…</span>}
              </>
            )}
          </div>
          {moveList}
        </div>
      }
    />
  )
}

function matches(expected: string, uci: string) {
  return expected.split('|').some((e) => e === uci || (e.length === 5 && e.slice(0, 4) === uci.slice(0, 4) && uci[4] === e[4]))
}

export function TaskRunner({ step, onDone, alreadyDone, onWrong }: { step: TaskStep; onDone: () => void; alreadyDone?: boolean; onWrong?: () => void }) {
  const { t } = useI18n()
  const PRAISE = [t('ln.praise1'), t('ln.praise2'), t('ln.praise3'), t('ln.praise4'), t('ln.praise5'), t('ln.praise6')]
  const WRONG = [t('ln.wrong1'), t('ln.wrong2'), t('ln.wrong3'), t('ln.wrong4')]
  const PROGRESS = [t('ln.progress1'), t('ln.progress2'), t('ln.progress3')]
  const userColor = step.userColor ?? (new Chess(step.fen).turn() as 'w' | 'b')
  const [fen, setFen] = useState(step.fen)
  const [idx, setIdx] = useState(0)
  const [status, setStatus] = useState<'play' | 'done'>('play')
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null)
  const [wrong, setWrong] = useState(0)
  const [shake, setShake] = useState(0)
  const [last, setLast] = useState<[string, string] | null>(null)
  const [hint, setHint] = useState(false)
  const [marks, setMarks] = useState<Record<string, 'good' | 'bad'>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setFen(step.fen)
    setIdx(0)
    setStatus('play')
    setMsg(null)
    setWrong(0)
    setLast(null)
    setHint(false)
    setMarks({})
  }, [step])

  useEffect(() => reset(), [reset])

  const finish = useCallback(
    (text?: string) => {
      setStatus('done')
      setMsg({ tone: 'good', text: text ?? step.success ?? pick(PRAISE) })
      setTimeout(() => play('success'), 250)
      onDone()
    },
    [onDone, step.success],
  )

  // the computer plays its replies from the solution
  useEffect(() => {
    if (status !== 'play') return
    const turn = new Chess(fen).turn()
    if (turn === userColor || idx >= step.solution.length) return
    timer.current = setTimeout(() => {
      const reply = step.solution[idx].split('|')[0]
      const r = tryMove(fen, parseUci(reply))
      if (!r) return
      soundFor(r.move, r.game)
      setFen(r.game.fen())
      setLast([r.move.from, r.move.to])
      setIdx((i) => i + 1)
      setMarks({})
    }, 650)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [fen, idx, status, step.solution, userColor])

  const onMove = (m: UciMove) => {
    if (status !== 'play') return false
    const r = tryMove(fen, m)
    if (!r) return false
    const uci = toUci(r.move)
    const expected = step.solution[idx]
    const isMate = r.game.isCheckmate()
    const reached = step.goal === 'to' && step.to?.includes(r.move.to)
    const right = (expected && matches(expected, uci)) || isMate || reached
    if (!right) {
      play('error')
      setShake((s) => s + 1)
      setWrong((w) => w + 1)
      setMarks({ [r.move.to]: 'bad' })
      setMsg({ tone: 'bad', text: wrong >= 1 && step.hint ? step.hint : pick(WRONG) })
      onWrong?.()
      return false
    }
    soundFor(r.move, r.game)
    setFen(r.game.fen())
    setLast([r.move.from, r.move.to])
    setMarks({ [r.move.to]: 'good' })
    setHint(false)
    const next = idx + 1
    setIdx(next)
    if (isMate || reached || next >= step.solution.length) finish()
    else setMsg({ tone: 'info', text: pick(PROGRESS) })
    return true
  }

  const showSolution = () => {
    // play the rest of the line automatically
    let f = fen
    let i = idx
    const stepOnce = () => {
      if (i >= step.solution.length) {
        setStatus('done')
        setMsg({ tone: 'info', text: t('ln.solutionShown') })
        onDone()
        return
      }
      const r = tryMove(f, parseUci(step.solution[i].split('|')[0]))
      if (!r) return
      soundFor(r.move, r.game)
      f = r.game.fen()
      i++
      setFen(f)
      setIdx(i)
      setLast([r.move.from, r.move.to])
      timer.current = setTimeout(stepOnce, 750)
    }
    setStatus('done')
    stepOnce()
  }

  const expected = step.solution[idx]?.split('|')[0]
  const userTurn = new Chess(fen).turn() === userColor
  const arrows: BoardArrow[] = [...toArrows(step.arrows)]
  if (hint && expected && userTurn && status === 'play') arrows.push({ from: expected.slice(0, 2), to: expected.slice(2, 4), color: 'green' })

  return (
    <Layout2
      board={
        <>
          <ChessBoard
            fen={fen}
            movable={status === 'play' ? userColor : false}
            onMove={onMove}
            lastMove={last}
            orientation={step.orientation ?? (userColor === 'w' ? 'white' : 'black')}
            arrows={idx === 0 || hint ? arrows : []}
            highlights={idx === 0 ? step.highlights : undefined}
            marks={marks}
            shake={shake}
          />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button variant="soft" onClick={reset}>
              <Icon name="reset" className="h-4 w-4" /> {t('ln.restart')}
            </Button>
            {status === 'play' && (
              <Button variant="soft" onClick={() => setHint(true)} disabled={!expected || !userTurn}>
                <Icon name="bulb" className="h-4 w-4" /> {t('ln.hint')}
              </Button>
            )}
            {status === 'play' && (wrong >= 2 || alreadyDone) && (
              <Button variant="ghost" onClick={showSolution}>
                <Icon name="eye" className="h-4 w-4" /> {t('ln.showSolution')}
              </Button>
            )}
          </div>
        </>
      }
      side={
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold">
            <span className={`h-3 w-3 rounded-full border ${userColor === 'w' ? 'border-black/20 bg-[#f4efe4]' : 'border-white/20 bg-[#1c1a17]'}`} />
            {t('ln.playingAs', { color: userColor === 'w' ? t('ln.white') : t('ln.black') })}
          </div>
          <RichText text={step.text} className="text-[1.05rem]" />
          {msg && (
            <div
              key={msg.text + wrong + idx}
              className={`animate-pop mt-4 flex items-start gap-2 rounded-xl border p-3.5 font-bold ${
                msg.tone === 'good' ? 'border-emerald/40 bg-emerald/10 text-emerald' : msg.tone === 'bad' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-gold/30 bg-gold-soft text-gold'
              }`}
              role="status"
            >
              <Icon name={msg.tone === 'good' ? 'check' : msg.tone === 'bad' ? 'x' : 'bulb'} className="mt-1 h-4 w-4 shrink-0" />
              <RichText text={msg.text} />
            </div>
          )}
        </div>
      }
    />
  )
}
