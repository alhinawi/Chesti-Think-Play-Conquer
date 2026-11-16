'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function LearnHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('ln.kicker')} title={t('ln.title')} desc={t('ln.desc')} />
}
