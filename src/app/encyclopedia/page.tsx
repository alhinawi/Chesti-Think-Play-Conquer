import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Icon, PageHeader } from '../../components/ui'
import { ARTICLES, CATEGORIES, TERMS } from '../../data/encyclopedia'

export const metadata: Metadata = {
  title: 'موسوعة الشطرنج بالعربي',
  description: `${ARTICLES.length} مقال شطرنج بالمصري: قواعد اللعبة، وأشهر الافتتاحات زي الإيطالية والصقلية، والتكتيك، والاستراتيجية، والنهايات، وتاريخ الشطرنج.`,
  alternates: { canonical: '/encyclopedia' },
  openGraph: { title: 'موسوعة الشطرنج', url: '/encyclopedia' },
}

export default function EncyclopediaPage() {
  const cats = CATEGORIES.filter((c) => ARTICLES.some((a) => a.category === c.id))
  return (
    <>
      <PageHeader kicker="الموسوعة" title="موسوعة الشطرنج" desc="كل اللي محتاج تعرفه عن اللعبة، مكتوب ببساطة وفيه رقع تقدر تتفرج عليها نقلة بنقلة.">
        <nav aria-label="أقسام الموسوعة" className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {cats.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-muted hover:border-gold/50 hover:text-gold">
              {c.name}
            </a>
          ))}
          <Link href="/glossary" className="shrink-0 rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-sm font-bold text-gold">
            قاموس المصطلحات
          </Link>
        </nav>
      </PageHeader>

      {cats.map((c) => (
        <section key={c.id} id={c.id} aria-labelledby={`h-${c.id}`} className="mb-10 scroll-mt-24">
          <h2 id={`h-${c.id}`} className="font-display text-xl font-bold">{c.name}</h2>
          <p className="mb-3 text-sm text-muted">{c.desc}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.filter((a) => a.category === c.id).map((a) => (
              <li key={a.id}>
                <Link href={`/encyclopedia/${a.id}`} className="luxe-card group flex h-full flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-gold/50">
                  <h3 className="font-bold group-hover:text-gold">{a.title}</h3>
                  {a.en && <p className="text-xs text-muted" dir="ltr">{a.en}</p>}
                  <p className="mt-1 text-sm text-muted">{a.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Link href="/glossary" className="luxe-card flex items-center gap-4 rounded-2xl p-5 hover:border-gold/50">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
          <Icon name="book" />
        </span>
        <span>
          <span className="block font-bold">قاموس المصطلحات</span>
          <span className="text-sm text-muted">{TERMS.length} كلمة هتسمعها من لاعيبة الشطرنج، بالعربي والإنجليزي.</span>
        </span>
        <Badge tone="muted">{TERMS.length}</Badge>
      </Link>
    </>
  )
}
