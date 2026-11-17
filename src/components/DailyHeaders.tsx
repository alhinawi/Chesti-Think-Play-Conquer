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

export function GamesHeader({ count }: { count: number }) {
  const en = useI18n().locale === 'en'
  return en ? (
    <PageHeader
      kicker="Immortal Games"
      title="The games that made history"
      desc={`${count} immortal games in chronological order from 1851 to 2023: Morphy, Anderssen, Capablanca, Fischer, Kasparov and Carlsen. Every game is shown move by move - and if you want a challenge, try "Guess the move" mode and play the hero.`}
    />
  ) : (
    <PageHeader
      kicker="أدوار خالدة"
      title="الأدوار اللي عملت التاريخ"
      desc={`${count} دور خالد مرتبين زمنياً من 1851 لـ 2023: مورفي وأندرسن وكابابلانكا وفيشر وكاسباروف وكارلسن. كل دور معروض نقلة بنقلة — ولو عايز تتحدى نفسك، جرّب وضع «خمّن النقلة» والعب دور البطل.`}
    />
  )
}
