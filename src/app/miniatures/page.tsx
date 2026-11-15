import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, PageHeader } from '../../components/ui'
import { MiniBoard } from '../../components/MiniBoard'
import { MINIATURES } from '../../data/miniatures'
import { replay, START_FEN } from '../../lib/chess'

export const metadata: Metadata = {
  title: 'ماتشات خاطفة - مات في أقل من 13 نقلة',
  description: `${MINIATURES.length} ماتش حقيقي قصير بين لاعبين 2500+ انتهى بكش مات على الرقعة: الغلطة القاتلة متعلم عليها ومتحقق منها بالمحرك، والشرح بالمصري نقلة بنقلة.`,
  alternates: { canonical: '/miniatures' },
}

export default function MiniaturesPage() {
  return (
    <>
      <PageHeader
        kicker="ماتشات خاطفة"
        title="ماتشات قصيرة، درس كبير"
        desc="ماتشات حقيقية بين لاعبين قويين (2500+ على Lichess) انتهت بكش مات على الرقعة في 6 لـ 13 نقلة. كل ماتش بيجاوب على سؤال واحد: إيه الغلطة اللي قلبته؟ الغلطة متعلم عليها بالأحمر ومتحقق منها بمحرك Stockfish، والبديل الصح مكتوب في الشرح."
      />
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <strong className="text-fg">الترتيب من الأقصر للأطول</strong> — كل الماتشات من Lichess Elite Database (بيانات مفتوحة CC0)، كل نقلة متحقق منها بـ chess.js، والمات النهائي مؤكد بالمحرك.
      </div>
      <section aria-label="كل الماتشات الخاطفة">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...MINIATURES]
            .sort((a, b) => a.moves.length - b.moves.length)
            .map((t) => {
              const { fens } = replay(START_FEN, t.moves)
              return (
                <li key={t.id}>
                  <Link href={`/miniatures/${t.id}`} className="luxe-card flex h-full gap-3 rounded-2xl p-3 transition hover:border-gold/50">
                    <div className="w-28 shrink-0">
                      <MiniBoard fen={fens[fens.length - 1]} flip={t.side === 'b'} label={`وضع المات في ${t.name}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold">{t.name}</h3>
                      <p className="text-xs text-muted" dir="ltr">{t.en}</p>
                      <p className="mt-1 line-clamp-3 text-sm text-muted">{t.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge tone="danger">مات في {Math.ceil(t.moves.length / 2)}</Badge>
                        <Badge tone="muted">{t.opening}</Badge>
                        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>كسب {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
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
