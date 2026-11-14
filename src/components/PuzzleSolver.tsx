'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { PUZZLES } from '../data/puzzles'
import type { TaskStep } from '../data/types'
import { markDone } from '../lib/progress'
import { celebrate } from './Celebrate'
import ShareButton from './ShareButton'
import RichText from './RichText'
import { TaskRunner } from './StepPlayer'
import { Icon } from './ui'

export default function PuzzleSolver({ puzzleId, nextId }: { puzzleId: string; nextId: string }) {
  const p = PUZZLES.find((x) => x.id === puzzleId)!
  const [solved, setSolved] = useState(false)
  const step = useMemo<TaskStep>(
    () => ({
      kind: 'task',
      text: p.text,
      fen: p.fen,
      solution: p.solution,
      goal: /مات/.test(p.theme) ? 'mate' : undefined,
      hint: 'دوّر على النقلات اللي بتدّي كش أو بتاكل الأول.',
      success: 'صح! حليت اللغز.',
      orientation: p.fen.split(' ')[1] === 'b' ? 'black' : 'white',
    }),
    [p],
  )
  const onDone = useCallback(() => {
    setSolved(true)
    markDone('puzzles', p.id)
    celebrate()
  }, [p.id])
  return (
    <div>
      <TaskRunner key={p.id} step={step} onDone={onDone} />
      {solved && (
        <div className="animate-fade-up mt-5 rounded-2xl border border-emerald/40 bg-emerald/5 p-4">
          <h2 className="mb-1 font-bold text-emerald">الشرح</h2>
          <RichText text={p.explain} />
          <div className="mt-3">
            <ShareButton text={`حليت لغز "${p.name}" على شطرنجي ♞ تقدر تحله إنت كمان؟`} path={`/puzzles/${p.id}/`} label="تحدّى صاحبك" />
          </div>
          <Link href={`/puzzles/${nextId}`} className="mt-3 inline-flex items-center gap-2 font-bold text-gold hover:underline">
            اللغز الجاي <Icon name="prev" className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
