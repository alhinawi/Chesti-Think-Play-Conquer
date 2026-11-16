import type { Metadata } from 'next'
import PlayComputer from '../../../components/PlayComputer'
import { ComputerHeader } from '../../../components/PlayHeaders'

export const metadata: Metadata = {
  title: 'العب شطرنج ضد الكمبيوتر',
  description: 'العب شطرنج ضد محرك Stockfish مجانًا بـ 8 مستويات صعوبة، مع تلميح ورجوع للنقلة. بيشتغل جوه المتصفح على الموبايل والكمبيوتر.',
  alternates: { canonical: '/play/computer' },
}

export default function Page() {
  return (
    <>
      <ComputerHeader />
      <PlayComputer />
    </>
  )
}
