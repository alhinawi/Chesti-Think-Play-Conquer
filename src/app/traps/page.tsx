import type { Metadata } from 'next'
import { TrapsHeader } from '../../components/ListHeaders'
import TrapsList from '../../components/TrapsList'
import { TRAPS } from '../../data/traps'

export const metadata: Metadata = {
  title: 'فخاخ الشطرنج في الافتتاح',
  description: `${TRAPS.length} فخ شطرنج مشهور مشروح بالمصري نقلة بنقلة: مات التلميذ، مات ليجال، فخ الفيل، فخ سفينة نوح، وغيرهم، وإزاي تتجنب كل واحد.`,
  alternates: { canonical: '/traps' },
}

export default function TrapsPage() {
  return (
    <>
      <TrapsHeader />
      <TrapsList />
    </>
  )
}
