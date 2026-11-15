import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TrapViewer from '../../../components/TrapViewer'
import RichText from '../../../components/RichText'
import { Badge } from '../../../components/ui'
import { MINIATURES } from '../../../data/miniatures'
import { SITE } from '../../../lib/site'

export const dynamicParams = false
export const generateStaticParams = () => MINIATURES.map((t) => ({ miniatureId: t.id }))

type Props = { params: Promise<{ miniatureId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).miniatureId
  const t = MINIATURES.find((x) => x.id === id)
  if (!t) return {}
  return {
    title: `${t.name} (${t.en}) — ماتش خاطف`,
    description: `${t.summary} النقلات بالترتيب والغلطة القاتلة مشروحة.`,
    alternates: { canonical: `/miniatures/${t.id}` },
    openGraph: { title: t.name, description: t.summary, url: `/miniatures/${t.id}`, type: 'article' },
  }
}

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default async function MiniaturePage({ params }: Props) {
  const { miniatureId } = await params
  const idx = MINIATURES.findIndex((t) => t.id === miniatureId)
  if (idx < 0) notFound()
  const t = MINIATURES[idx]
  const next = MINIATURES[(idx + 1) % MINIATURES.length]
  const winner = t.side === 'w' ? t.white : t.black
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${t.name} (${t.en})`,
    description: t.summary,
    inLanguage: 'ar',
    url: `${SITE.url}/miniatures/${t.id}`,
    publisher: { '@type': 'Organization', name: SITE.name },
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/miniatures" className="hover:text-gold">ماتشات خاطفة</Link>
        <span className="mx-2">/</span>
        <span>{t.opening}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{t.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone="muted">{t.opening}</Badge>
        <Badge tone="muted">{t.level}</Badge>
        <Badge tone={t.side === 'w' ? 'gold' : 'emerald'}>كسب {t.side === 'w' ? 'الأبيض' : 'الأسود'}</Badge>
        <Badge tone="danger">مات في {Math.ceil(t.moves.length / 2)}</Badge>
      </div>
      <p className="mb-1 text-sm text-muted" dir="ltr">
        {t.white} ({t.whiteElo}) vs {t.black} ({t.blackElo}) — {t.date}
      </p>
      <p className="mb-5 text-sm">
        <a href={t.source} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline" dir="ltr">
          الماتش الأصلي على Lichess ↗
        </a>
      </p>
      <p className="mb-5 max-w-3xl text-lg">{t.summary}</p>

      <TrapViewer trapId={t.id} items={MINIATURES} bucket="miniatures" />

      <section aria-labelledby="avoid" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="avoid" className="mb-2 font-display text-lg font-bold text-gold">الدرس المستفاد</h2>
        <RichText text={t.avoid} />
      </section>

      <section aria-labelledby="moves" className="mt-6">
        <h2 id="moves" className="mb-2 font-display text-lg font-bold">النقلات كلها</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm">{pgn(t.moves)}</p>
        <ol className="mt-4 space-y-2">
          {t.moves.map((m, i) =>
            t.notes[i] ? (
              <li key={i} className={`flex gap-3 rounded-lg p-2 ${i === t.mistake ? 'bg-danger/10' : ''}`}>
                <span dir="ltr" className="w-20 shrink-0 font-mono text-sm font-bold text-gold">
                  {Math.floor(i / 2) + 1}.{i % 2 ? '..' : ''} {m}
                </span>
                <RichText text={t.notes[i]} className="text-sm" />
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <p className="mt-6 text-xs text-muted">الماتش من Lichess Elite Database (CC0). الغلطة والمات متحقق منهم بمحرك Stockfish، وكل النقلات بـ chess.js. كسبان: {winner}.</p>

      <nav aria-label="ماتشات تانية" className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/miniatures/${next.id}`} className="text-muted hover:text-gold">الماتش الجاي: {next.name} ←</Link>
      </nav>
    </article>
  )
}
