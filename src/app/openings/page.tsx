import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, PageHeader } from '../../components/ui'
import { MiniBoard } from '../../components/MiniBoard'
import { OPENINGS } from '../../data/openings'
import { replay, START_FEN } from '../../lib/chess'

export const metadata: Metadata = {
  title: 'مكتبة الافتتاحيات',
  description: `${OPENINGS.length} افتتاحية شطرنج مشروحة بالمصري: الخط الرئيسي نقلة بنقلة، وخطة الأبيض وخطة الأسود في كل واحدة.`,
  alternates: { canonical: '/openings' },
}

const GROUPS = [
  { id: 'w', title: 'للأبيض', desc: 'افتتاحيات تبدأ بيها أنت الهجوم' },
  { id: 'b', title: 'للأسود', desc: 'دفاعات ترد بيها على e4 وd4' },
] as const

export default function OpeningsPage() {
  return (
    <>
      <PageHeader
        kicker="مكتبة الافتتاحيات"
        title="اختار افتتاحيتك"
        desc="مش لازم تحفظ خطوط كتير: افهم الفكرة والخطة، وجرّبها في أدوارك. كل افتتاحية مشروحة نقلة بنقلة وبخطط الجانبين."
      />
      {GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`side-${g.id}`} className="mb-8">
          <h2 id={`side-${g.id}`} className="mb-1 font-display text-xl font-bold">{g.title}</h2>
          <p className="mb-3 text-sm text-muted">{g.desc}</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPENINGS.filter((o) => o.side === g.id).map((o) => {
              const { fens } = replay(START_FEN, o.moves)
              return (
                <li key={o.id}>
                  <Link href={`/openings/${o.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={o.side === 'b'} label={`الوضع الأخير في ${o.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{o.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{o.en} • {o.eco}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{o.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone={o.level === 'سهل' ? 'emerald' : o.level === 'متوسط' ? 'gold' : 'danger'}>{o.level}</Badge>
                        <Badge tone="muted">{o.moves.filter((_, i) => i % 2 === 0).length} نقلة</Badge>
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
