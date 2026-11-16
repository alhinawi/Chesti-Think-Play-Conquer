'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export function DailyHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('dl.dailyKicker')} title={t('dl.dailyTitle')} desc={t('dl.dailyDesc')} />
}

export function RushHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('dl.rushKicker')} title={t('dl.rushTitle')} desc={t('dl.rushDesc')} />
}

export function EndgamesHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('dl.endKicker')} title={t('dl.endTitle')} desc={t('dl.endDesc')} />
}

export function SettingsHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('st.kicker')} title={t('st.title')} />
}
