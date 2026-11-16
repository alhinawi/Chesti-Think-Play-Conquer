import type { Metadata } from 'next'
import { World3DProHeader } from '../../../components/PlayHeaders'
import World3DProLoader from '../../../components/World3DProLoader'

export const metadata: Metadata = {
  title: 'عالم شطرنج 3D - النسخة الفخمة (معاينة)',
  description: 'معاينة النسخة الجديدة من عالم شطرنج 3D: قطع Staunton حقيقية، ثيمات، وكاميرات سينمائية.',
  robots: { index: false },
}

export default function World3DProPage() {
  return (
    <>
      <World3DProHeader />
      <World3DProLoader />
      <p className="mt-4 text-center text-xs text-muted" dir="ltr">
        Chess pieces: "A Beautiful Game" © 2020 ASWF, licensed CC-BY 4.0
      </p>
    </>
  )
}
