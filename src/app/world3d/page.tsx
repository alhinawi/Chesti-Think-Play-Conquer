import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'
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
      <PageHeader
        kicker="عالم شطرنج 3D"
        title="المواقف الخالدة بزاوية 360°"
        desc="رقعة شطرنج ثلاثية الأبعاد بتلف بيها بحرية كاملة: شوف مات الأوبرا، وتضحية لاسكر، وصدمة الديب بلو من الزاوية اللي تعجبك."
      />
      <World3DLoader />
    </>
  )
}
