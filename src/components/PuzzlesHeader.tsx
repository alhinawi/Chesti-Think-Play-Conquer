'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function PuzzlesHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('pz.kicker')} title={t('pz.title')} desc={t('pz.desc')} />
}
