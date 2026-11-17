import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TrapPageBody from '../../../components/TrapPageBody'
import { TRAPS } from '../../../data/traps'
import { SITE } from '../../../lib/site'

export const dynamicParams = false
export const generateStaticParams = () => TRAPS.map((t) => ({ trapId: t.id }))

type Props = { params: Promise<{ trapId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).trapId
  const t = TRAPS.find((x) => x.id === id)
  if (!t) return {}
  return {
    title: `${t.name} (${t.en}) — فخ شطرنج`,
    description: `${t.summary} النقلات بالترتيب وإزاي تتجنبه.`,
    alternates: { canonical: `/traps/${t.id}` },
    openGraph: { title: t.name, description: t.summary, url: `/traps/${t.id}`, type: 'article' },
  }
}

export default async function TrapPage({ params }: Props) {
  const { trapId } = await params
  const idx = TRAPS.findIndex((t) => t.id === trapId)
  if (idx < 0) notFound()
  const t = TRAPS[idx]
  const next = TRAPS[(idx + 1) % TRAPS.length]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${t.name} (${t.en})`,
    description: t.summary,
    inLanguage: 'ar',
    url: `${SITE.url}/traps/${t.id}`,
    publisher: { '@type': 'Organization', name: SITE.name },
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrapPageBody trapId={t.id} nextId={next.id} />
    </article>
  )
}
