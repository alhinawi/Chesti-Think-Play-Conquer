import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '../../components/ui'
import { EndgamesHeader } from '../../components/DailyHeaders'
import { MiniBoard } from '../../components/MiniBoard'
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENDGAMES.map((e) => (
          <li key={e.id}>
            <Link href={`/endgames/${e.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
              <div className="w-28 shrink-0">
                <MiniBoard fen={e.fen} label={`موقف ${e.name}`} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold">{e.name}</h2>
                <p className="text-xs text-muted" dir="ltr">{e.en}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{e.text}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge tone={e.level === 'سهل' ? 'emerald' : e.level === 'متوسط' ? 'gold' : 'danger'}>{e.level}</Badge>
                  <Badge tone="muted">{e.theme}</Badge>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
