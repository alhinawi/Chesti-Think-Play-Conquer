import type { Metadata } from 'next'
import PuzzleRush from '../../components/PuzzleRush'
import { RushHeader } from '../../components/DailyHeaders'

export const metadata: Metadata = {
  title: 'سباق الألغاز',
  description: 'حل أكبر عدد من ألغاز الشطرنج من غير 3 غلطات: سباق بيقيس سرعة التكتيك عندك.',
  alternates: { canonical: '/rush' },
}

export default function RushPage() {
  return (
    <>
      <RushHeader />
      <PuzzleRush />
    </>
  )
}
