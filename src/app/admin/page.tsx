import type { Metadata } from 'next'
import Admin from '../../components/Admin'
import AdminHeader from '../../components/AdminHeader'

export const metadata: Metadata = {
  title: 'لوحة التحكم',
  robots: { index: false },
  alternates: { canonical: '/admin' },
}

export default function Page() {
  return (
    <>
      <AdminHeader />
      <Admin />
    </>
  )
}
