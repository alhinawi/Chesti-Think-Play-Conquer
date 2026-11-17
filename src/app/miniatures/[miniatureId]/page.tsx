import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MiniaturePageBody from '../../../components/MiniaturePageBody'
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

export default async function MiniaturePage({ params }: Props) {
  const { miniatureId } = await params
  const idx = MINIATURES.findIndex((t) => t.id === miniatureId)
  if (idx < 0) notFound()
  const t = MINIATURES[idx]
  const next = MINIATURES[(idx + 1) % MINIATURES.length]
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
      <MiniaturePageBody miniatureId={t.id} nextId={next.id} />
    </article>
  )
}
