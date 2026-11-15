import type { Metadata } from 'next'
import Admin from '../../components/Admin'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'لوحة التحكم',
  robots: { index: false },
  alternates: { canonical: '/admin' },
}

export default function Page() {
  return (
    <>
      <PageHeader kicker="للأدمن" title="لوحة التحكم" desc="نظرة سريعة على اللاعبين والأدوار والنتايج - متاحة لحساب الأدمن بس." />
      <Admin />
    </>
  )
}
