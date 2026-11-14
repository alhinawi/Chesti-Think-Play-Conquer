import type { Metadata } from 'next'
import DailyPuzzle from '../../components/DailyPuzzle'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'لغز اليوم',
  description: 'لغز شطرنج جديد كل يوم بالمصري. حلّه وحافظ على سلسلة أيامك وتحدّى صحابك.',
  alternates: { canonical: '/daily' },
}

export default function Page() {
  return (
    <>
      <PageHeader kicker="كل يوم" title="لغز اليوم" desc="لغز واحد كل يوم، هو هو لكل الناس. حلّه عشان السلسلة ماتقطعش." />
      <DailyPuzzle />
    </>
  )
}
