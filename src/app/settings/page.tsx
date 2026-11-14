import type { Metadata } from 'next'
import SettingsPanel from '../../components/SettingsPanel'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'الإعدادات',
  robots: { index: false },
  alternates: { canonical: '/settings' },
}

export default function Page() {
  return (
    <>
      <PageHeader kicker="الإعدادات" title="ظبّط شطرنجي على مزاجك" />
      <SettingsPanel />
    </>
  )
}
