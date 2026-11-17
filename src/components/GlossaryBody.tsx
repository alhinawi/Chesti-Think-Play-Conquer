'use client'

import Link from 'next/link'
import { PageHeader } from './ui'
import { TERMS } from '../data/encyclopedia'
import { useI18n } from '../lib/i18n'
import { useEncLoc } from '../lib/i18n/content'

export default function GlossaryBody() {
  const en = useI18n().locale === 'en'
  const { termDef } = useEncLoc()
  return (
    <>
      <nav aria-label={en ? 'Breadcrumb' : 'مسار الصفحة'} className="mb-3 text-sm text-muted">
        <Link href="/encyclopedia" className="hover:text-gold">{en ? 'Encyclopedia' : 'الموسوعة'}</Link>
      </nav>
      <PageHeader
        kicker={en ? 'Glossary' : 'القاموس'}
        title={en ? 'Chess glossary' : 'قاموس مصطلحات الشطرنج'}
        desc={en ? 'The words you will hear often, and what each one means in a line.' : 'الكلمات اللي هتسمعها كتير، ومعنى كل واحدة في سطر.'}
      />
      <dl className="grid gap-3 sm:grid-cols-2">
        {TERMS.map((t, i) => (
          <div key={i} className="luxe-card rounded-2xl p-4">
            <dt className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-lg font-bold text-gold">{en ? t.en : t.term}</span>
              {!en && <span className="text-sm text-muted" dir="ltr">{t.en}</span>}
            </dt>
            <dd className="mt-1 text-[0.98rem]">{termDef(i, t.def)}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
