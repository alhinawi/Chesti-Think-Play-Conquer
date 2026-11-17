import type { Metadata } from 'next'
import GlossaryBody from '../../components/GlossaryBody'
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
      <GlossaryBody />
    </>
  )
}
