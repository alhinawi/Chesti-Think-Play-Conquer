import { Suspense } from 'react'
import Profile from '../../components/Profile'
import Account from '../../components/Account'
import Leaderboard from '../../components/Leaderboard'
import MeHeader from '../../components/MeHeader'

export default function Page() {
  return (
    <>
      <Suspense>
        <MeHeader />
      </Suspense>
      <div className="mb-6">
        <Suspense>
          <Account />
        </Suspense>
      </div>
      <Profile />
      <div className="mt-6">
        <Leaderboard />
      </div>
    </>
  )
}
