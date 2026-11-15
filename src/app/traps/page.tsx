import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'
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
      <PageHeader kicker="الفخاخ" title="فخاخ الافتتاح" desc="كل فخ مشروح نقلة بنقلة: إزاي بيتنصب، وفين الغلطة بالظبط، وإزاي ماتقعش فيه." />
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <strong className="text-fg">الترتيب من الأقوى للأضعف</strong> — محسوب من الخط نفسه، مش رأي شخصي: فخ المات أولاً، وبعدين الفخ اللي بيكسب أكبر مادة
        (وزير 9، طابية 5، فيل أو حصان 3، عسكري 1). ولو اتساووا، الأسرع عقابًا بعد الغلطة ييجي الأول.
      </div>
      <TrapsList />
    </>
  )
}
