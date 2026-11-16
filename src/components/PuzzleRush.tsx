'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { PUZZLES } from '../data/puzzles'
import type { TaskStep } from '../data/types'
import { celebrate } from './Celebrate'
import { saveScore } from '../lib/api'
import { TaskRunner } from './StepPlayer'
import { Button, Icon } from './ui'
import { useI18n } from '../lib/i18n'
import { themeSlug } from '../lib/i18n/dataLabels'

const BEST_KEY = 'chesti-rush-best'
const STRIKES = 3

type Phase = 'idle' | 'running' | 'done'

export default function PuzzleRush() {
  const { t } = useI18n()
  const [phase, setPhase] = useState<Phase>('idle')
  const [puzzleId, setPuzzleId] = useState('')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [best, setBest] = useState(0)
  const [lock, setLock] = useState(false)
  const recent = useRef<string[]>([])

  const start = useCallback(() => {
    setBest(Number(localStorage.getItem(BEST_KEY) || 0))
    setScore(0)
    setStrikes(0)
    setRound((r) => r + 1)
    recent.current = []
    const p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    recent.current.push(p.id)
    setPuzzleId(p.id)
    setPhase('running')
  }, [])

  const next = useCallback(() => {
    let p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    let guard = 0
    while (recent.current.includes(p.id) && guard++ < 40) p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    recent.current = [...recent.current.slice(-8), p.id]
    setRound((r) => r + 1)
    setPuzzleId(p.id)
    setLock(false)
  }, [])

  const onDone = useCallback(() => {
    if (lock) return
    setLock(true)
    setScore((s) => {
      const n = s + 1
      if (n > best) {
        setBest(n)
        localStorage.setItem(BEST_KEY, String(n))
      }
      return n
    })
    setTimeout(next, 900)
  }, [best, lock, next])

  const onWrong = useCallback(() => {
    setStrikes((k) => {
      const n = k + 1
      if (n >= STRIKES) {
        setPhase('done')
        if (score >= 5) celebrate()
        saveScore('rush', score)
      }
      return n
    })
  }, [score])

  const puzzle = PUZZLES.find((x) => x.id === puzzleId)
  const step = useMemo<TaskStep | null>(() => {
    if (!puzzle) return null
    return {
      kind: 'task',
      text: puzzle.text,
      fen: puzzle.fen,
      solution: puzzle.solution,
      goal: /مات/.test(puzzle.theme) ? 'mate' : undefined,
      hint: t('pz.rushHint'),
      success: t('pz.rushSuccess'),
      orientation: puzzle.fen.split(' ')[1] === 'b' ? 'black' : 'white',
    }
  }, [puzzle, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
          <p className="text-xs text-muted">{t('pz.rushSolved')}</p>
          <p className="ltr text-2xl font-bold text-gold">{score}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
          <p className="text-xs text-muted">{t('pz.rushStrikes')}</p>
          <p className="ltr text-2xl font-bold" aria-label={t('pz.rushStrikesAria', { n: strikes, total: STRIKES })}>
            {Array.from({ length: STRIKES }, (_, i) => (
              <span key={i} className={i < strikes ? 'text-danger' : 'text-muted/40'}>✕</span>
            ))}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
          <p className="text-xs text-muted">{t('pz.rushBest')}</p>
          <p className="ltr text-2xl font-bold text-emerald">{best}</p>
        </div>
        {phase === 'running' && puzzle && (
          <p className="text-sm font-bold text-muted">{themeSlug(puzzle.theme) ? t(`pz.theme${themeSlug(puzzle.theme)![0].toUpperCase() + themeSlug(puzzle.theme)!.slice(1)}`) : puzzle.theme}</p>
        )}
      </div>

      {phase === 'idle' && (
        <div className="luxe-card rounded-2xl p-6 text-center">
          <Icon name="bulb" className="mx-auto mb-3 h-10 w-10 text-gold" />
          <p className="mb-4 max-w-md mx-auto text-muted">
            {t('pz.rushIntro', { n: STRIKES })}
          </p>
          <Button onClick={start}>{t('pz.rushStart')}</Button>
        </div>
      )}

      {phase === 'running' && step && (
        <TaskRunner key={`${puzzleId}-${round}`} step={step} onDone={onDone} onWrong={onWrong} />
      )}

      {phase === 'done' && (
        <div className="luxe-card animate-fade-up rounded-2xl p-6 text-center">
          <h2 className="font-display text-2xl font-bold">
            {score >= 10 ? t('pz.rushEndGreat') : score >= 5 ? t('pz.rushEndGood') : t('pz.rushEndPlain')}
          </h2>
          <p className="mt-2 text-muted">
            {t('pz.rushScore', { n: score, unit: score === 1 ? t('pz.rushUnitOne') : t('pz.rushUnitMany') })}
            {score >= best && score > 0 && ` ${t('pz.rushNewBest')}`}
          </p>
          <Button className="mt-4" onClick={start}>{t('pz.rushAgain')}</Button>
        </div>
      )}
    </div>
  )
}
