import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GamePageBody from '../../../components/GamePageBody'
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
      <GamePageBody gameId={g.id} nextId={next.id} />
    </article>
  )
}
