import type { Metadata } from 'next'
import SquareTrainer from '../../components/SquareTrainer'
import SquaresHeader from '../../components/SquaresHeader'

export const metadata: Metadata = {
  title: 'تمرين الخانات',
  description: 'تعلم أسماء خانات الرقعة بسرعة: تمرين 30 ثانية بيقوّي عينك على الخانات زي المحترفين.',
  alternates: { canonical: '/squares' },
}

export default function SquaresPage() {
  return (
    <>
      <SquaresHeader />
      <SquareTrainer />
    </>
  )
}
