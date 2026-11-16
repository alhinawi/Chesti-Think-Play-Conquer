import type { Metadata } from 'next'
import { PlayHub } from '../../components/PlayHeaders'

export const metadata: Metadata = {
  title: 'العب شطرنج أونلاين مجانًا',
  description: 'العب شطرنج ضد الكمبيوتر بـ 8 مستويات من المبتدئ لستوكفيش بكل قوته، أو العب مع صاحبك على نفس الجهاز أو أونلاين بلينك. مجانًا.',
  alternates: { canonical: '/play' },
}

export default function PlayPage() {
  return <PlayHub />
}
