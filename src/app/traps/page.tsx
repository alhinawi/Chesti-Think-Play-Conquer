import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, PageHeader } from '../../components/ui'
import { MiniBoard } from '../../components/MiniBoard'
import { TRAPS } from '../../data/traps'
import { TRAP_STRENGTH } from '../../data/trap-strength'
import { replay, START_FEN } from '../../lib/chess'

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
      <section aria-label="كل الفخاخ مرتبة بالقوة">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...TRAPS]
              .sort((a, b) => {
                const sa = TRAP_STRENGTH[a.id] ?? { mate: false, material: 0, plies: 99 }
                const sb = TRAP_STRENGTH[b.id] ?? { mate: false, material: 0, plies: 99 }
                return Number(sb.mate) - Number(sa.mate) || sb.material - sa.material || sa.plies - sb.plies
              })
              .map((t, rank) => {
              const { fens } = replay(START_FEN, t.moves)
              return (
                <li key={t.id}>
                  <Link href={`/traps/${t.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={t.side === 'b'} label={`الوضع الأخير في ${t.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{t.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{t.en}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone="danger">#{rank + 1}</Badge>
                        {TRAP_STRENGTH[t.id]?.mate ? (
                          <Badge tone="danger">كش مات</Badge>
                        ) : (
                          <Badge tone="gold" >+{TRAP_STRENGTH[t.id]?.material ?? 0} مادة</Badge>
                        )}
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>بينصبه {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
                        <Badge tone="muted">{t.level}</Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
    </>
  )
}
