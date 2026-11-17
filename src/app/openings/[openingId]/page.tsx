import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OpeningPageBody from '../../../components/OpeningPageBody'
import { OPENINGS } from '../../../data/openings'
import { TRAPS } from '../../../data/traps'
import { SITE } from '../../../lib/site'

export const dynamicParams = false
export const generateStaticParams = () => OPENINGS.map((o) => ({ openingId: o.id }))

type Props = { params: Promise<{ openingId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).openingId
  const o = OPENINGS.find((x) => x.id === id)
  if (!o) return {}
  return {
    title: `${o.name} (${o.en}) — افتتاحية شطرنج`,
    description: `${o.summary} الخط الرئيسي وخطط الجانبين.`,
    alternates: { canonical: `/openings/${o.id}` },
    openGraph: { title: o.name, description: o.summary, url: `/openings/${o.id}`, type: 'article' },
  }
}

export default async function OpeningPage({ params }: Props) {
  const { openingId } = await params
  const idx = OPENINGS.findIndex((o) => o.id === openingId)
  if (idx < 0) notFound()
  const o = OPENINGS[idx]
  const next = OPENINGS[(idx + 1) % OPENINGS.length]
  const TRAP_KEYS: Record<string, string[]> = {
    'italian-game': ['الإيطالي'],
    'ruy-lopez': ['الإسباني', 'لوبيز'],
    'sicilian-najdorf': ['الصقلي'],
    'sicilian-dragon': ['الصقلي', 'التنين'],
    'french-defense': ['الفرنسي'],
    'caro-kann': ['كارو'],
    'queens-gambit': ['الوزير'],
    'kings-indian': ['الهندي'],
    'london-system': ['لندن'],
    'english-opening': ['الإنجليزية'],
    'scandinavian': ['الإسكندنافي'],
    'pirc-defense': ['بيرك'],
  }
  const keys = TRAP_KEYS[o.id] ?? []
  const related = keys.length ? TRAPS.filter((t) => keys.some((k) => t.opening.includes(k))) : []
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${o.name} (${o.en})`,
    description: o.summary,
    inLanguage: 'ar',
    url: `${SITE.url}/openings/${o.id}`,
    publisher: { '@type': 'Organization', name: SITE.name },
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <OpeningPageBody openingId={o.id} nextId={next.id} related={related.map((t) => ({ id: t.id, name: t.name, summary: t.summary }))} />
    </article>
  )
}
