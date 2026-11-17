import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ArticleBody from '../../../components/ArticleBody'
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
      <ArticleBody articleId={a.id} />
    </article>
  )
}
