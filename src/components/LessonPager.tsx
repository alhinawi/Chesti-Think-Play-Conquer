'use client'

import Link from 'next/link'
import { useI18n } from '../lib/i18n'
import { useLessonLoc } from '../lib/i18n/content'

type Ref = { id: string; title: string } | undefined

export default function LessonPager({ prev, next }: { prev: Ref; next: Ref }) {
  const { t } = useI18n()
  const ll = useLessonLoc()
  return (
    <nav aria-label={t('ln.moreLessons')} className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-sm">
      {prev ? <Link href={`/learn/${prev.id}`} className="text-muted hover:text-gold">→ {ll.title(prev.id, prev.title)}</Link> : <span />}
      {next ? <Link href={`/learn/${next.id}`} className="text-muted hover:text-gold">{ll.title(next.id, next.title)} ←</Link> : <Link href="/puzzles" className="text-muted hover:text-gold">{t('ln.puzzlesLink')}</Link>}
    </nav>
  )
}
