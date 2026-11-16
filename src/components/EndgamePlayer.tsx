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

export default function EndgamePlayer({ endgameId, nextId }: { endgameId: string; nextId: string }) {
  const e = ENDGAMES.find((x) => x.id === endgameId)!
  const [solved, setSolved] = useState(false)
  const step = useMemo<TaskStep>(
    () => ({
      kind: 'task',
      text: e.text,
      fen: e.fen,
      solution: e.solution,
      goal: e.goal,
      hint: 'فكّر في خانات هروب الملك الأول.',
      success: 'أحسنت! الموقف اتحل.',
      orientation: e.fen.split(' ')[1] === 'b' ? 'black' : 'white',
    }),
    [e],
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
          <h2 className="mb-1 font-bold text-emerald">الشرح</h2>
          <RichText text={e.explain} />
          <Link href={`/endgames/${nextId}`} className="mt-3 inline-flex items-center gap-2 font-bold text-gold hover:underline">
            الموقف الجاي <Icon name="prev" className="h-4 w-4 ltr:-scale-x-100" />
          </Link>
        </div>
      )}
    </div>
  )
}
