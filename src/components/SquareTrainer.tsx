'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from '../lib/settings'
import { play } from '../lib/sound'
import { Button } from './ui'
import { useI18n } from '../lib/i18n'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8']
const BEST_KEY = 'chesti-square-best'
const ROUND_SECONDS = 30

type Phase = 'idle' | 'running' | 'done'

export default function SquareTrainer() {
  const { t } = useI18n()
  const { boardTheme } = useSettings()
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState('')
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(ROUND_SECONDS)
  const [best, setBest] = useState(0)
  const [lastHit, setLastHit] = useState<{ sq: string; ok: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setBest(Number(localStorage.getItem(BEST_KEY) || 0))
  }, [])

  const pick = useCallback((prev: string) => {
    let sq = prev
    while (sq === prev) sq = FILES[Math.floor(Math.random() * 8)] + RANKS[Math.floor(Math.random() * 8)]
    return sq
  }, [])

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setPhase('done')
  }, [])

  const start = useCallback(() => {
    setScore(0)
    setLeft(ROUND_SECONDS)
    setTarget(pick(''))
    setPhase('running')
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          stop()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [pick, stop])

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  useEffect(() => {
    if (phase === 'done' && score > best) {
      setBest(score)
      localStorage.setItem(BEST_KEY, String(score))
    }
  }, [phase, score, best])

  function hit(sq: string) {
    if (phase !== 'running') return
    const ok = sq === target
    setLastHit({ sq, ok })
    setTimeout(() => setLastHit(null), 180)
    if (ok) {
      play('capture')
      setScore((s) => s + 1)
      setTarget((t) => pick(t))
    } else {
      play('end')
    }
  }

  const squares: string[] = []
  for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) squares.push(FILES[f] + RANKS[r])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,480px)_1fr]">
      <div
        className="grid w-full grid-cols-8 overflow-hidden rounded-xl border-4"
        style={{ borderColor: boardTheme.frame }}
        role="group"
        aria-label={t('lx.sqBoard')}
      >
        {squares.map((sq) => {
          const f = FILES.indexOf(sq[0])
          const r = Number(sq[1])
          const light = (f + r) % 2 === 1
          const hitStyle =
            lastHit?.sq === sq
              ? { boxShadow: lastHit.ok ? 'inset 0 0 0 4px #3ba776' : 'inset 0 0 0 4px #d0584a' }
              : undefined
          return (
            <button
              key={sq}
              type="button"
              aria-label={sq}
              onClick={() => hit(sq)}
              className="aspect-square text-[10px] font-bold"
              style={{ backgroundColor: light ? boardTheme.light : boardTheme.dark, color: light ? boardTheme.dark : boardTheme.light, ...hitStyle }}
            >
              <span className="sr-only sm:not-sr-only">{sq === target && phase === 'running' ? '?' : ''}</span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col items-start gap-4">
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
            <p className="text-xs text-muted">{t('lx.sqTime')}</p>
            <p className="ltr text-2xl font-bold text-gold">{left}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
            <p className="text-xs text-muted">{t('lx.sqScore')}</p>
            <p className="ltr text-2xl font-bold">{score}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-5 py-3 text-center">
            <p className="text-xs text-muted">{t('lx.sqBest')}</p>
            <p className="ltr text-2xl font-bold text-emerald">{best}</p>
          </div>
        </div>
        {phase !== 'running' ? (
          <>
            {phase === 'done' && (
              <p className="rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm">
                {score >= 20 ? t('lx.sqGreat') : score >= 10 ? t('lx.sqGood') : t('lx.sqStart')} {t('lx.sqResult', { n: score, s: ROUND_SECONDS })}
              </p>
            )}
            <Button onClick={start}>{phase === 'done' ? t('lx.sqAgain') : t('lx.sqGo')}</Button>
            <p className="text-sm text-muted">
              {t('lx.sqIntroA')} <span dir="ltr" className="font-mono font-bold text-gold">e4</span> {t('lx.sqIntroB', { s: ROUND_SECONDS })}
            </p>
          </>
        ) : (
          <p className="rounded-2xl border border-gold/30 bg-gold-soft px-6 py-4 text-center">
            <span className="text-sm text-muted">{t('lx.sqClick')}</span>
            <span dir="ltr" className="mt-1 block font-mono text-4xl font-bold text-gold">{target}</span>
          </p>
        )}
      </div>
    </div>
  )
}
