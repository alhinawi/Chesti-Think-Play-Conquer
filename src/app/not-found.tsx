'use client'

import Link from 'next/link'
import { LinkButton } from '../components/ui'
import { useI18n } from '../lib/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-7xl leading-none text-gold" aria-hidden>♞</p>
      <h1 className="mt-4 font-display text-2xl font-bold">{t('lx.nfTitle')}</h1>
      <p className="mt-2 text-muted">{t('lx.nfText')}</p>
      <div className="mt-6 flex justify-center gap-2">
        <LinkButton to="/">{t('lx.nfHome')}</LinkButton>
        <Link href="/learn" className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold text-muted hover:text-ink">{t('lx.nfLessons')}</Link>
      </div>
    </div>
  )
}
