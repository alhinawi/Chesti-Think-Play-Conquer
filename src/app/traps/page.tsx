import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, PageHeader } from '../../components/ui'
import { MiniBoard } from '../../components/MiniBoard'
import { TRAPS, TRAP_LEVELS } from '../../data/traps'
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
      {TRAP_LEVELS.map((lvl) => (
        <section key={lvl} aria-labelledby={`lvl-${lvl}`} className="mb-8">
          <h2 id={`lvl-${lvl}`} className="mb-3 font-display text-xl font-bold">{lvl}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRAPS.filter((t) => t.level === lvl).map((t) => {
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
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>بينصبه {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
