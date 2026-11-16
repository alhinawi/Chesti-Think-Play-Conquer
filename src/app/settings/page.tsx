import type { Metadata } from 'next'
import SettingsPanel from '../../components/SettingsPanel'
import { SettingsHeader } from '../../components/DailyHeaders'

export const metadata: Metadata = {
  title: 'الإعدادات',
  robots: { index: false },
  alternates: { canonical: '/settings' },
}

export default function Page() {
  return (
    <>
      <SettingsHeader />
      <SettingsPanel />
    </>
  )
}
