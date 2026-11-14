import type { Metadata } from 'next'
import SquareTrainer from '../../components/SquareTrainer'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'تمرين الخانات',
  description: 'تعلم أسماء خانات الرقعة بسرعة: تمرين 30 ثانية بيقوّي عينك على الخانات زي المحترفين.',
  alternates: { canonical: '/squares' },
}

export default function SquaresPage() {
  return (
    <>
      <PageHeader
        kicker="تمرين الخانات"
        title="عينك على الرقعة"
        desc="المحترف مش بيفكر إزاي يوصل للخانة، عينه بتروح لها لوحدها. التمرين ده بيبني الذاكرة دي: 30 ثانية وكل خانة صح بنقطة."
      />
      <SquareTrainer />
    </>
  )
}
