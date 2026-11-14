import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ArticleBlocks from '../../../components/ArticleBlocks'
import { Badge } from '../../../components/ui'
import { ARTICLES, categoryName } from '../../../data/encyclopedia'
import { SITE } from '../../../lib/site'

export const dynamicParams = false
export const generateStaticParams = () => ARTICLES.map((a) => ({ articleId: a.id }))

type Props = { params: Promise<{ articleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).articleId
  const a = ARTICLES.find((x) => x.id === id)
  if (!a) return {}
  return {
    title: `${a.title}${a.en ? ` (${a.en})` : ''} — موسوعة الشطرنج`,
    description: `${a.summary} شرح بالمصري مع رقع تفاعلية من موسوعة ${SITE.short}.`,
    alternates: { canonical: `/encyclopedia/${a.id}` },
    openGraph: { title: a.title, description: a.summary, url: `/encyclopedia/${a.id}`, type: 'article' },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { articleId } = await params
  const a = ARTICLES.find((x) => x.id === articleId)
  if (!a) notFound()
  const related = ARTICLES.filter((x) => x.category === a.category && x.id !== a.id).slice(0, 4)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    alternativeHeadline: a.en,
    description: a.summary,
    inLanguage: 'ar',
    articleSection: categoryName(a.category),
    url: `${SITE.url}/encyclopedia/${a.id}`,
    publisher: { '@type': 'Organization', name: SITE.name },
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الموسوعة', item: `${SITE.url}/encyclopedia` },
      { '@type': 'ListItem', position: 2, name: a.title, item: `${SITE.url}/encyclopedia/${a.id}` },
    ],
  }
  return (
    <article className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]) }} />
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/encyclopedia" className="hover:text-gold">الموسوعة</Link>
        <span className="mx-2">/</span>
        <Link href={`/encyclopedia#${a.category}`} className="hover:text-gold">{categoryName(a.category)}</Link>
      </nav>
      <h1 className="text-3xl font-bold">{a.title}</h1>
      {a.en && <p className="text-sm text-muted" dir="ltr">{a.en}</p>}
      <div className="mt-2 mb-4 flex flex-wrap gap-2">
        <Badge tone="muted">{categoryName(a.category)}</Badge>
      </div>
      <p className="mb-4 text-lg text-muted">{a.summary}</p>
      <ArticleBlocks blocks={a.blocks} />

      {related.length > 0 && (
        <aside aria-labelledby="related" className="mt-12 border-t border-line pt-6">
          <h2 id="related" className="mb-3 text-lg font-bold">اقرا كمان</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/encyclopedia/${r.id}`} className="block rounded-xl border border-line bg-surface p-3 hover:border-gold/50">
                  <span className="font-bold">{r.title}</span>
                  <span className="block text-sm text-muted">{r.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  )
}
