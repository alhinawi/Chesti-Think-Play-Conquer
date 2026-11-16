import type { Metadata } from 'next'
import LearnHeader from '../../components/LearnHeader'
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
      <LearnHeader />
      <LessonList />
    </>
  )
}
