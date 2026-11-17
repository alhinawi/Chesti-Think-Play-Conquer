import type { Metadata } from 'next'
import EndgamesGrid from '../../components/EndgamesGrid'
import { EndgamesHeader } from '../../components/DailyHeaders'
import { ENDGAMES } from '../../data/endgames'

export const metadata: Metadata = {
  title: 'معمل النهايات',
  description: `${ENDGAMES.length} مواقف نهاية حاسمة تتدرب عليها بإيدك: مات الملك والوزير، الصف الأخير، ترقية العساكر، والمقابلة الملكية.`,
  alternates: { canonical: '/endgames' },
}

export default function EndgamesPage() {
  return (
    <>
      <EndgamesHeader />
      <EndgamesGrid />
    </>
  )
}
