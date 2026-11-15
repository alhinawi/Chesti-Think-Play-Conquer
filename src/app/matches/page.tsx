import type { Metadata } from 'next'
import MatchesExplorer from '../../components/MatchesExplorer'
import { PageHeader } from '../../components/ui'

export const metadata: Metadata = {
  title: 'ماتشات النخبة',
  description:
    'آلاف الماتشات الحقيقية بين أقوى حسابات Lichess (2500+) معروضة نقلة بنقلة: فلتر بالافتتاحية واللاعب وحرف ECO.',
  alternates: { canonical: '/matches' },
}

export default function MatchesPage() {
  return (
    <>
      <PageHeader
        kicker="ماتشات النخبة"
        title="آلاف الماتشات من أعلى مستوى أونلاين"
        desc="مكتبة ضخمة من ماتشات حقيقية بين حسابات 2500+ (بشر ومحركات) من Lichess Elite Database - بيانات مفتوحة CC0، كل نقلة متحقق منها بـ chess.js. فلتر بالافتتاحية أو اللاعب أو حرف ECO وشغّل أي ماتش على الرقعة."
      />
      <MatchesExplorer />
    </>
  )
}
