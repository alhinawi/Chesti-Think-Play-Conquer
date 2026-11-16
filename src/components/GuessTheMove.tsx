'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAMES } from '../data/games'
import { replay, START_FEN, toUci, type UciMove } from '../lib/chess'
import { useAuth } from '../lib/auth'
import { readProgress, recordGuess } from '../lib/progress'
import { play } from '../lib/sound'
import ChessBoard from './ChessBoard'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'

type Phase = 'guess' | 'retry' | 'reveal' | 'done'

/** وضع «خمّن النقلة»: العب دور بطل الدور وحاول تتوقع نقلاته قبل ما تشوفها. */
export default function GuessTheMove({ gameId }: { gameId: string }) {
  const { t } = useI18n()
  const g = GAMES.find((x) => x.id === gameId)!
  // بتخمّن نقلات الفائز (الأبيض عند التعادل)
  const side: 'w' | 'b' = g.result === '0-1' ? 'b' : 'w'
  const { fens, history } = useMemo(() => replay(START_FEN, g.moves), [g])
  const n = g.moves.length
  const totalGuesses = useMemo(() => history.filter((m) => m.color === side).length, [history, side])

  const [ply, setPly] = useState(0)
  const [phase, setPhase] = useState<Phase>('guess')
  const { status } = useAuth()
  const authed = status === 'authed'
  const [savedBest, setSavedBest] = useState(() => readProgress().guesses?.[gameId]?.score ?? 0)
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [run, setRun] = useState(0) // current streak of first-try hits
  const [best, setBest] = useState(0)
  const [lastMove, setLastMove] = useState<[string, string] | null>(null)
  const [marks, setMarks] = useState<Record<string, 'good' | 'bad'>>({})

  const expected = ply < n ? history[ply] : null

  // نقلة الخصم بتتلعب لوحدها بعد لحظة
  useEffect(() => {
    if (phase === 'done' || !expected || expected.color === side) return
    const id = setTimeout(() => {
      play(expected.san.includes('#') ? 'end' : expected.san.includes('+') ? 'check' : expected.captured ? 'capture' : 'move')
      setLastMove([expected.from, expected.to])
      const np = ply + 1
      setPly(np)
      if (np >= n) setPhase('done')
    }, 650)
    return () => clearTimeout(id)
  }, [expected, side, phase, ply, n])

  const onMove = useCallback(
    (m: UciMove) => {
      if (!expected || expected.color !== side || phase === 'reveal' || phase === 'done') return false
      const ok = toUci(m) === toUci({ from: expected.from, to: expected.to, promotion: expected.promotion })
      const np = ply + 1
      if (ok) {
        const firstTry = phase === 'guess'
        const pts = firstTry ? (expected.san.includes('x') || expected.san.includes('+') || expected.san.includes('#') ? 5 : 3) : 1
        play(expected.san.includes('#') ? 'end' : expected.san.includes('+') ? 'check' : expected.captured ? 'capture' : 'move')
        setMarks({ [expected.to]: 'good' })
        setLastMove([expected.from, expected.to])
        setScore((s) => s + pts)
        if (firstTry) {
          setHits((h) => h + 1)
          setRun((r) => {
            setBest((b) => Math.max(b, r + 1))
            return r + 1
          })
        } else {
          setRun(0)
        }
        setPly(np)
        setPhase(np >= n ? 'done' : 'guess')
        setTimeout(() => setMarks({}), 500)
        return true
      }
      // غلط
      play('error')
      if (phase === 'guess') {
        setMarks({ [m.to]: 'bad' })
        setPhase('retry')
      } else {
        // كشف النقلة الصح
        setMarks({ [expected.from]: 'good', [expected.to]: 'good' })
        setLastMove([expected.from, expected.to])
        setPhase('reveal')
        setRun(0)
        setTimeout(() => {
          setMarks({})
          setPly(np)
          setPhase(np >= n ? 'done' : 'guess')
        }, 1400)
      }
      return false
    },
    [expected, side, phase, ply, n],
  )

  const reset = useCallback(() => {
    setPly(0)
    setPhase('guess')
    setScore(0)
    setHits(0)
    setRun(0)
    setBest(0)
    setLastMove(null)
    setMarks({})
  }, [])

  // سجّل أفضل نتيجة لما الدور يخلص
  useEffect(() => {
    if (phase !== 'done') return
    recordGuess(gameId, hits, totalGuesses, score)
    setSavedBest((b) => Math.max(b, score))
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const note = ply > 0 && phase !== 'done' ? g.notes[ply - 1] : undefined

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <ChessBoard
          fen={fens[ply]}
          orientation={side === 'w' ? 'white' : 'black'}
          movable={phase === 'guess' || phase === 'retry' ? side : false}
          onMove={onMove}
          lastMove={lastMove}
          marks={marks}
        />
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-1 text-sm text-muted">
            {t(side === 'w' ? 'gm.youAreWhite' : 'gm.youAreBlack', { name: side === 'w' ? g.white : g.black })}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-gold" dir="ltr">{score}</span>
            <span className="text-sm text-muted">{t('gm.points')}</span>
            <span className="text-sm text-muted" dir="ltr">{t('gm.firstTryCount', { hits, total: totalGuesses })}</span>
          </div>
          {run >= 3 && <p className="mt-1 text-sm text-emerald-400">{t('gm.streak', { run })}</p>}
          {authed && savedBest > 0 && phase !== 'done' && <p className="mt-1 text-xs text-muted">{t('gm.savedBest', { score: savedBest })}</p>}
        </div>

        <div className="min-h-20 rounded-2xl border border-line bg-surface p-4 text-sm" aria-live="polite">
          {phase === 'done' ? (
            <>
              <p className="mb-2 font-display text-lg font-bold text-gold">{t('gm.doneTitle')}</p>
              <p>
                {t('gm.doneSummary', { hits, total: totalGuesses, score })}
                {hits === totalGuesses
                  ? t('gm.verdictPerfect')
                  : hits >= totalGuesses * 0.7
                    ? t('gm.verdictGreat')
                    : hits >= totalGuesses * 0.4
                      ? t('gm.verdictOk')
                      : t('gm.verdictLow')}
              </p>
              {best >= 2 && <p className="mt-1 text-sm text-muted">{t('gm.longestRun', { best })}</p>}
            </>
          ) : phase === 'reveal' ? (
            <p>
              {t('gm.reveal', { san: expected?.san ?? '' })}
            </p>
          ) : phase === 'retry' ? (
            <p>
              {t('gm.retryHint', { piece: t(`gm.piece${(expected?.piece ?? 'p').toUpperCase()}`) })}
            </p>
          ) : expected && expected.color === side ? (
            <p>{t('gm.yourTurn', { name: side === 'w' ? g.white : g.black })}</p>
          ) : (
            <p>{t('gm.opponentMove', { side: t(side === 'w' ? 'gm.sideBlack' : 'gm.sideWhite') })}</p>
          )}
          {note && <p className="mt-2 border-t border-line pt-2 text-muted">{note}</p>}
        </div>

        {phase === 'done' ? (
          <Button onClick={reset} className="w-full">{t('gm.playAgain')}</Button>
        ) : (
          <Button onClick={reset} variant="ghost" className="w-full">{t('gm.fromStart')}</Button>
        )}
        <p className="text-xs text-muted">{t('gm.scoringNote')}</p>
      </div>
    </div>
  )
}
