import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '../../components/ui'
import { TERMS } from '../../data/encyclopedia'
import { SITE } from '../../lib/site'

export const metadata: Metadata = {
  title: 'قاموس مصطلحات الشطرنج',
  description: `${TERMS.length} مصطلح شطرنج بالعربي والإنجليزي ومعناه بالمصري: كش، كش مات، تبييت، شوكة، تثبيت، زوجزوانج، وغيرهم.`,
  alternates: { canonical: '/glossary' },
}

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `قاموس مصطلحات الشطرنج — ${SITE.name}`,
    inLanguage: 'ar',
    url: `${SITE.url}/glossary`,
    hasDefinedTerm: TERMS.map((t) => ({ '@type': 'DefinedTerm', name: t.term, alternateName: t.en, description: t.def })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/encyclopedia" className="hover:text-gold">الموسوعة</Link>
      </nav>
      <PageHeader kicker="القاموس" title="قاموس مصطلحات الشطرنج" desc="الكلمات اللي هتسمعها كتير، ومعنى كل واحدة في سطر." />
      <dl className="grid gap-3 sm:grid-cols-2">
        {TERMS.map((t) => (
          <div key={t.en} className="luxe-card rounded-2xl p-4">
            <dt className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-lg font-bold text-gold">{t.term}</span>
              <span className="text-sm text-muted" dir="ltr">{t.en}</span>
            </dt>
            <dd className="mt-1 text-[0.98rem]">{t.def}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
