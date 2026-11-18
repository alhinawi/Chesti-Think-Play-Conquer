import type { Metadata } from 'next'
import MatchesExplorer from '../../components/MatchesExplorer'
import MatchesHeader from '../../components/MatchesHeader'

export const metadata: Metadata = {
  title: 'ماتشات النخبة',
  description:
    'آلاف الماتشات الحقيقية بين أقوى حسابات Lichess (2500+) معروضة نقلة بنقلة: فلتر بالافتتاحية واللاعب وحرف ECO.',
  alternates: { canonical: '/matches' },
}

export default function MatchesPage() {
  return (
    <>
      <MatchesHeader />
      <MatchesExplorer />
    </>
  )
}
