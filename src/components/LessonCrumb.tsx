'use client'

import Link from 'next/link'
import { useI18n } from '../lib/i18n'
import { useLessonLoc } from '../lib/i18n/content'

export default function LessonCrumb({ chapterTitle, chapterId }: { chapterTitle: string; chapterId?: string }) {
  const { t } = useI18n()
  const ll = useLessonLoc()
  return (
    <nav aria-label={t('ln.breadcrumbAria')} className="mb-3 text-sm text-muted">
      <Link href="/learn" className="hover:text-gold">{t('ln.breadcrumb')}</Link>
      <span className="mx-2">/</span>
      <span>{ll.chapterTitle(chapterId, chapterTitle)}</span>
    </nav>
  )
}
