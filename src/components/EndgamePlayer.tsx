'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { ENDGAMES } from '../data/endgames'
import type { TaskStep } from '../data/types'
import { markDone } from '../lib/progress'
import { celebrate } from './Celebrate'
import RichText from './RichText'
import { TaskRunner } from './StepPlayer'
import { Icon } from './ui'
import { useI18n } from '../lib/i18n'

export default function EndgamePlayer({ endgameId, nextId }: { endgameId: string; nextId: string }) {
  const { t } = useI18n()
  const e = ENDGAMES.find((x) => x.id === endgameId)!
  const [solved, setSolved] = useState(false)
  const step = useMemo<TaskStep>(
    () => ({
      kind: 'task',
      text: e.text,
      fen: e.fen,
      solution: e.solution,
      goal: e.goal,
      hint: t('dl.endHint'),
      success: t('dl.endSuccess'),
      orientation: e.fen.split(' ')[1] === 'b' ? 'black' : 'white',
    }),
    [e, t],
  )
  const onDone = useCallback(() => {
    setSolved(true)
    markDone('endgames', e.id)
    celebrate()
  }, [e.id])
  return (
    <div>
      <TaskRunner key={e.id} step={step} onDone={onDone} />
      {solved && (
        <div className="animate-fade-up mt-5 rounded-2xl border border-emerald/40 bg-emerald/5 p-4">
          <h2 className="mb-1 font-bold text-emerald">{t('dl.endExplainH')}</h2>
          <RichText text={e.explain} />
          <Link href={`/endgames/${nextId}`} className="mt-3 inline-flex items-center gap-2 font-bold text-gold hover:underline">
            {t('dl.endNext')} <Icon name="prev" className="h-4 w-4 ltr:-scale-x-100" />
          </Link>
        </div>
      )}
    </div>
  )
}
