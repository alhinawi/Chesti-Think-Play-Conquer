import type { Metadata } from 'next'
import PlayFriend from '../../../components/PlayFriend'
import { FriendHeader } from '../../../components/PlayHeaders'

export const metadata: Metadata = {
  title: 'العب شطرنج مع صاحبك',
  description: 'العب شطرنج مع صاحبك على نفس الجهاز، أو ابعتله لينك والعبوا أونلاين.',
  alternates: { canonical: '/play/friend' },
}

export default function Page() {
  return (
    <>
      <FriendHeader />
      <PlayFriend />
    </>
  )
}
