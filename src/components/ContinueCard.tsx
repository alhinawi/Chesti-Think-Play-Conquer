'use client'

import Link from 'next/link'
import { ALL_LESSONS } from '../data/lessons'
import { useAuth } from '../lib/auth'
import { useProgress } from '../lib/progress'
import { useI18n } from '../lib/i18n'

export default function ContinueCard() {
  const { lessons } = useProgress()
  const { t } = useI18n()
  const { status } = useAuth()
  if (status !== 'authed' || !lessons.length) return null
  const next = ALL_LESSONS.find((l) => !lessons.includes(l.id))
  return (
    <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft p-4 text-sm">
      <p>
        {t('lx.contDone', { n: lessons.length, m: ALL_LESSONS.length })}
      </p>
      {next ? (
        <Link href={`/learn/${next.id}`} className="mt-1 inline-block font-bold text-gold underline-offset-4 hover:underline">
          {t('lx.contNext', { title: next.title })}
        </Link>
      ) : (
        <p className="mt-1 font-bold text-gold">{t('lx.contAll')}</p>
      )}
    </div>
  )
}
