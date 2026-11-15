import type { Metadata } from 'next'
import Profile from '../../components/Profile'
import Account from '../../components/Account'
import Leaderboard from '../../components/Leaderboard'
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
      <div className="mb-6">
        <Account />
      </div>
      <Profile />
      <div className="mt-6">
        <Leaderboard />
      </div>
    </>
  )
}
