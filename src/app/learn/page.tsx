import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'
import LessonList from '../../components/LessonList'
import { ALL_LESSONS } from '../../data/lessons'

export const metadata: Metadata = {
  title: 'دروس الشطرنج للمبتدئين',
  description: `${ALL_LESSONS.length} درس شطرنج تفاعلي بالمصري: حركة القطع، والقواعد، وأشكال المات، والافتتاح، والتكتيك، والنهايات.`,
  alternates: { canonical: '/learn' },
}

export default function LearnPage() {
  return (
    <>
      <PageHeader kicker="الدروس" title="اتعلم خطوة بخطوة" desc="كل درس بيشرح فكرة واحدة، وبعدين بيخليك تجربها بإيدك على الرقعة. تقدّمك بيتحفظ على جهازك." />
      <LessonList />
    </>
  )
}
