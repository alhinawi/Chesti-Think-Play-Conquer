'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function AdminHeader() {
  const en = useI18n().locale === 'en'
  return en ? (
    <PageHeader kicker="Admin" title="Dashboard" desc="A quick look at players, games and scores - available to the admin account only." />
  ) : (
    <PageHeader kicker="للأدمن" title="لوحة التحكم" desc="نظرة سريعة على اللاعبين والأدوار والنتايج - متاحة لحساب الأدمن بس." />
  )
}
