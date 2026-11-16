'use client'

import Link from 'next/link'
import { useI18n } from '../lib/i18n'

export default function LessonCrumb({ chapterTitle }: { chapterTitle: string }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t('ln.breadcrumbAria')} className="mb-3 text-sm text-muted">
      <Link href="/learn" className="hover:text-gold">{t('ln.breadcrumb')}</Link>
      <span className="mx-2">/</span>
      <span>{chapterTitle}</span>
    </nav>
  )
}
