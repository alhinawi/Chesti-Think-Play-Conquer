'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_LESSONS } from '../data/lessons'
import { markDone } from '../lib/progress'
import { celebrate } from './Celebrate'
import { play } from '../lib/sound'
import { StepView } from './StepPlayer'
import { Button, Icon } from './ui'
import { useI18n } from '../lib/i18n'

export default function LessonPlayer({ lessonId, nextId, nextTitle }: { lessonId: string; nextId?: string; nextTitle?: string }) {
  const { t } = useI18n()
  const lesson = ALL_LESSONS.find((l) => l.id === lessonId)!
  const router = useRouter()
  const [i, setI] = useState(0)
  const [done, setDone] = useState<boolean[]>(() => lesson.steps.map(() => false))
  const step = lesson.steps[i]
  const last = i === lesson.steps.length - 1
  const finished = done.every(Boolean)

  const onDone = useCallback(() => setDone((d) => (d[i] ? d : d.map((v, k) => (k === i ? true : v)))), [i])

  useEffect(() => {
    if (finished) {
      markDone('lessons', lessonId)
      play('success')
      celebrate()
    }
  }, [finished, lessonId])

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={lesson.steps.length} aria-valuenow={i + 1} aria-label={t('ln.steps')}>
          {lesson.steps.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-label={t('ln.stepN', { n: k + 1 })}
              className={`h-2 flex-1 rounded-full transition ${k === i ? 'bg-gold' : done[k] ? 'bg-emerald/70' : 'bg-surface-2'}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted">{i + 1}/{lesson.steps.length}</span>
      </div>

      <div key={i} className="animate-fade-up">
        <StepView step={step} onDone={onDone} done={done[i]} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="soft" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          <Icon name="next" className="h-4 w-4 ltr:-scale-x-100" /> {t('ln.prev')}
        </Button>
        {!last ? (
          <Button onClick={() => setI((x) => x + 1)} disabled={!done[i]}>
            {t('ln.next')} <Icon name="prev" className="h-4 w-4 ltr:-scale-x-100" />
          </Button>
        ) : finished ? (
          <Button onClick={() => router.push(nextId ? `/learn/${nextId}` : '/puzzles')}>
            {nextId ? t('ln.nextLesson', { title: nextTitle ?? '' }) : t('ln.tryPuzzles')} <Icon name="prev" className="h-4 w-4 ltr:-scale-x-100" />
          </Button>
        ) : (
          <span className="text-sm text-muted">{t('ln.finishFirst')}</span>
        )}
      </div>
      {finished && last && (
        <p className="animate-pop mt-4 rounded-xl border border-emerald/40 bg-emerald/10 p-3 text-center font-bold text-emerald" role="status">
          {t('ln.lessonDone')}
        </p>
      )}
    </div>
  )
}
