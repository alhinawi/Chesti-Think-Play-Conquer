import type { Metadata } from 'next'
import { OpeningsHeader } from '../../components/ListHeaders'
import OpeningsList from '../../components/OpeningsList'
import { OPENINGS } from '../../data/openings'

export const metadata: Metadata = {
  title: 'مكتبة الافتتاحيات',
  description: `${OPENINGS.length} افتتاحية شطرنج مشروحة بالمصري: الخط الرئيسي نقلة بنقلة، وخطة الأبيض وخطة الأسود في كل واحدة.`,
  alternates: { canonical: '/openings' },
}

export default function OpeningsPage() {
  return (
    <>
      <OpeningsHeader />
      <OpeningsList />
    </>
  )
}
