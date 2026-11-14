import type { Metadata } from 'next'
import PuzzleRush from '../../components/PuzzleRush'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'سباق الألغاز',
  description: 'حل أكبر عدد من ألغاز الشطرنج من غير 3 غلطات: سباق بيقيس سرعة التكتيك عندك.',
  alternates: { canonical: '/rush' },
}

export default function RushPage() {
  return (
    <>
      <PageHeader
        kicker="سباق الألغاز"
        title="كم لغز تقدر تحل؟"
        desc="ألغاز عشوائية ورا بعض: كل حل صح نقطة، و3 غلطات بينهوا الجولة. من غير وقت، الدقة هي اللي بتحسب."
      />
      <PuzzleRush />
    </>
  )
}
