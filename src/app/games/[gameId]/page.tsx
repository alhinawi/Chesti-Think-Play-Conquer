import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GameViewer from '../../../components/GameViewer'
import { Badge } from '../../../components/ui'
import { GAMES } from '../../../data/games'
import { SITE } from '../../../lib/site'

export const dynamicParams = false
export const generateStaticParams = () => GAMES.map((g) => ({ gameId: g.id }))

type Props = { params: Promise<{ gameId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).gameId
  const g = GAMES.find((x) => x.id === id)
  if (!g) return {}
  return {
    title: `${g.name} (${g.en}) — دور خالد`,
    description: `${g.summary} ${g.white} ضد ${g.black}، ${g.place} ${g.year}.`,
    alternates: { canonical: `/games/${g.id}` },
    openGraph: { title: g.name, description: g.summary, url: `/games/${g.id}`, type: 'article' },
  }
}

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
}

export default async function GamePage({ params }: Props) {
  const { gameId } = await params
  const idx = GAMES.findIndex((g) => g.id === gameId)
  if (idx < 0) notFound()
  const g = GAMES[idx]
  const next = GAMES[(idx + 1) % GAMES.length]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${g.name} (${g.en})`,
    description: g.summary,
    inLanguage: 'ar',
    url: `${SITE.url}/games/${g.id}`,
    publisher: { '@type': 'Organization', name: SITE.name },
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/games" className="hover:text-gold">أدوار خالدة</Link>
        <span className="mx-2">/</span>
        <span>{g.year}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{g.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{g.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone="muted">{g.white} × {g.black}</Badge>
        <Badge tone="muted">{g.place} {g.year}</Badge>
        <Badge tone={g.result === '1-0' ? 'gold' : g.result === '0-1' ? 'emerald' : 'muted'}>{g.result}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{g.summary}</p>

      <GameViewer gameId={g.id} />

      <section aria-labelledby="lesson" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="lesson" className="mb-2 font-display text-lg font-bold text-gold">الدرس المستفاد</h2>
        <p className="text-sm">{g.lesson}</p>
      </section>

      <section aria-labelledby="pgn" className="mt-6">
        <h2 id="pgn" className="mb-2 font-display text-lg font-bold">الدور كامل</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm leading-7">{pgn(g.moves)} {g.result}</p>
      </section>

      <nav aria-label="أدوار تانية" className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/games/${next.id}`} className="text-muted hover:text-gold">الدور الجاي: {next.name} ←</Link>
      </nav>
    </article>
  )
}
