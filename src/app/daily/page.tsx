import type { Metadata } from 'next'
import DailyPuzzle from '../../components/DailyPuzzle'
import { DailyHeader } from '../../components/DailyHeaders'

export const metadata: Metadata = {
  title: 'لغز اليوم',
  description: 'لغز شطرنج جديد كل يوم بالمصري. حلّه وحافظ على سلسلة أيامك وتحدّى صحابك.',
  alternates: { canonical: '/daily' },
}

export default function Page() {
  return (
    <>
      <DailyHeader />
      <DailyPuzzle />
    </>
  )
}
