import type { Metadata } from 'next'
import { World3DHeader } from '../../components/PlayHeaders'
import World3DLoader from '../../components/World3DLoader'
import { WORLD3D_POSITIONS } from '../../data/world3d'

export const metadata: Metadata = {
  title: 'عالم شطرنج 3D',
  description: `${WORLD3D_POSITIONS.length} من أشهر المواقف في تاريخ الشطرنج على رقعة ثلاثية الأبعاد: لفّ وقرّب وشوف اللحظات الخالدة من كل الزوايا.`,
  alternates: { canonical: '/world3d' },
}

export default function World3DPage() {
  return (
    <>
      <World3DHeader />
      <World3DLoader />
    </>
  )
}
