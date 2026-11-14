import type { Metadata } from 'next'
import PlayFriend from '../../../components/PlayFriend'
import { PageHeader } from '../../../components/ui'

export const metadata: Metadata = {
  title: 'العب شطرنج مع صاحبك',
  description: 'العب شطرنج مع صاحبك على نفس الجهاز، أو ابعتله لينك والعبوا أونلاين من غير تسجيل.',
  alternates: { canonical: '/play/friend' },
}

export default function Page() {
  return (
    <>
      <PageHeader kicker="العب" title="مع صاحبك" />
      <PlayFriend />
    </>
  )
}
