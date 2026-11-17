'use client'

import { useLessonLoc } from '../lib/i18n/content'

export default function LessonHeader({ id, title, summary }: { id: string; title: string; summary: string }) {
  const ll = useLessonLoc()
  const l = ll.lesson({ id, title, summary, steps: [] })
  return (
    <>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{l.title}</h1>
      <p className="mt-1 mb-5 text-muted">{l.summary}</p>
    </>
  )
}
