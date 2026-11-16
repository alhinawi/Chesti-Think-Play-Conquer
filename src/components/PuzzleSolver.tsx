'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { PUZZLES } from '../data/puzzles'
import type { TaskStep } from '../data/types'
import { markDaily, markDone } from '../lib/progress'
import { celebrate } from './Celebrate'
import ShareButton from './ShareButton'
import RichText from './RichText'
import { TaskRunner } from './StepPlayer'
import { Icon } from './ui'
import { useI18n } from '../lib/i18n'

/** daily = the local date when this is the puzzle of the day */
export default function PuzzleSolver({ puzzleId, nextId, daily }: { puzzleId: string; nextId: string; daily?: string }) {
  const { t } = useI18n()
  const p = PUZZLES.find((x) => x.id === puzzleId)!
  const [solved, setSolved] = useState(false)
  const step = useMemo<TaskStep>(
    () => ({
      kind: 'task',
      text: p.text,
      fen: p.fen,
      solution: p.solution,
      goal: /مات/.test(p.theme) ? 'mate' : undefined,
      hint: t('pz.hint'),
      success: t('pz.success'),
      orientation: p.fen.split(' ')[1] === 'b' ? 'black' : 'white',
    }),
    [p, t],
  )
  const onDone = useCallback(() => {
    setSolved(true)
    markDone('puzzles', p.id)
    if (daily) markDaily(daily)
    celebrate()
  }, [p.id, daily])
  return (
    <div>
      <TaskRunner key={p.id} step={step} onDone={onDone} />
      {solved && (
        <div className="animate-fade-up mt-5 rounded-2xl border border-emerald/40 bg-emerald/5 p-4">
          <h2 className="mb-1 font-bold text-emerald">{t('pz.explainTitle')}</h2>
          <RichText text={p.explain} />
          <div className="mt-3">
            <ShareButton text={t('pz.shareText', { name: p.name })} path={`/puzzles/${p.id}/`} label={t('pz.shareLabel')} />
          </div>
          <Link href={`/puzzles/${nextId}`} className="mt-3 inline-flex items-center gap-2 font-bold text-gold hover:underline">
            {t('pz.next')} <Icon name="prev" className="h-4 w-4 ltr:-scale-x-100" />
          </Link>
        </div>
      )}
    </div>
  )
}
