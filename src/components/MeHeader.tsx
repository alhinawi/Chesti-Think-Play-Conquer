'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function MeHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('me.kicker')} title={t('me.title')} />
}
