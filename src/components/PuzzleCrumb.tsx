'use client'

import Link from 'next/link'
import { useI18n } from '../lib/i18n'

export default function PuzzleCrumb({ theme }: { theme: string }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t('pz.breadcrumbAria')} className="mb-3 text-sm text-muted">
      <Link href="/puzzles" className="hover:text-gold">{t('pz.breadcrumb')}</Link>
      <span className="mx-2">/</span>
      <span>{theme}</span>
    </nav>
  )
}
