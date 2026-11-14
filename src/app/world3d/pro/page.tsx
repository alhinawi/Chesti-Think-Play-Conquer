import type { Metadata } from 'next'
import { PageHeader } from '../../../components/ui'
import World3DProLoader from '../../../components/World3DProLoader'

export const metadata: Metadata = {
  title: 'عالم شطرنج 3D - النسخة الفخمة (معاينة)',
  description: 'معاينة النسخة الجديدة من عالم شطرنج 3D: قطع Staunton حقيقية، ثيمات، وكاميرات سينمائية.',
  robots: { index: false },
}

export default function World3DProPage() {
  return (
    <>
      <PageHeader
        kicker="معاينة"
        title="عالم شطرنج 3D - النسخة الفخمة"
        desc="نسخة معاينة قيد التطوير: قطع Staunton موديلة باحتراف (A Beautiful Game - ASWF، CC-BY 4.0)، 4 ثيمات، و5 زوايا كاميرا."
      />
      <World3DProLoader />
      <p className="mt-4 text-center text-xs text-muted" dir="ltr">
        Chess pieces: "A Beautiful Game" © 2020 ASWF, licensed CC-BY 4.0
      </p>
    </>
  )
}
