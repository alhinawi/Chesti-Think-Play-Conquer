'use client'

import Link from 'next/link'
import { useI18n } from '../lib/i18n'
import { themeSlug } from '../lib/i18n/dataLabels'

export default function PuzzleCrumb({ theme }: { theme: string }) {
  const { t } = useI18n()
  const ts = themeSlug(theme)
  return (
    <nav aria-label={t('pz.breadcrumbAria')} className="mb-3 text-sm text-muted">
      <Link href="/puzzles" className="hover:text-gold">{t('pz.breadcrumb')}</Link>
      <span className="mx-2">/</span>
      <span>{ts ? t(`pz.theme${ts}`) : theme}</span>
    </nav>
  )
}
