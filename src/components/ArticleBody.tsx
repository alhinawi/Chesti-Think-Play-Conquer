'use client'

import Link from 'next/link'
import ArticleBlocks from './ArticleBlocks'
import { Badge } from './ui'
import { ARTICLES, CATEGORIES } from '../data/encyclopedia'
import { useI18n } from '../lib/i18n'
import { useEncLoc } from '../lib/i18n/content'

export default function ArticleBody({ articleId }: { articleId: string }) {
  const en = useI18n().locale === 'en'
  const { article, category } = useEncLoc()
  const a0 = ARTICLES.find((x) => x.id === articleId)!
  const a = article(a0)
  const cat = category(CATEGORIES.find((c) => c.id === a.category)!).name
  const related = ARTICLES.filter((x) => x.category === a.category && x.id !== a.id).slice(0, 4).map(article)
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/encyclopedia" className="hover:text-gold">{en ? 'Encyclopedia' : 'الموسوعة'}</Link>
        <span className="mx-2">/</span>
        <Link href={`/encyclopedia#${a.category}`} className="hover:text-gold">{cat}</Link>
      </nav>
      <h1 className="font-display text-3xl font-bold">{a.title}</h1>
      {a.en && !en && <p className="text-sm text-muted" dir="ltr">{a.en}</p>}
      <div className="mt-2 mb-4 flex flex-wrap gap-2">
        <Badge tone="muted">{cat}</Badge>
      </div>
      <p className="mb-4 text-lg text-muted">{a.summary}</p>
      <ArticleBlocks blocks={a.blocks} />

      {related.length > 0 && (
        <aside aria-labelledby="related" className="mt-12 border-t border-line pt-6">
          <h2 id="related" className="mb-3 font-display text-lg font-bold">{en ? 'Read more' : 'اقرا كمان'}</h2>
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
    </>
  )
}
