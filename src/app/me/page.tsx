import type { Metadata } from 'next'
import Profile from '../../components/Profile'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'ملفي',
  robots: { index: false },
  alternates: { canonical: '/me' },
}

export default function Page() {
  return (
    <>
      <PageHeader kicker="ملفي" title="مشوارك في الشطرنج" />
      <Profile />
    </>
  )
}
