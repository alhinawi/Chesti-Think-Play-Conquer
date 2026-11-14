import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OpeningViewer from '../../../components/OpeningViewer'
import { Badge, LinkButton } from '../../../components/ui'
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

function pgn(moves: string[]) {
  return moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ')
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
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/openings" className="hover:text-gold">الافتتاحيات</Link>
        <span className="mx-2">/</span>
        <span>{o.side === 'w' ? 'للأبيض' : o.side === 'b' ? 'للأسود' : 'للجانبين'}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{o.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{o.en} • {o.eco}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone={o.level === 'سهل' ? 'emerald' : o.level === 'متوسط' ? 'gold' : 'danger'}>{o.level}</Badge>
        <Badge tone={o.side === 'w' ? 'gold' : 'emerald'}>{o.side === 'w' ? 'للأبيض' : o.side === 'b' ? 'للأسود' : 'للجانبين'}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{o.summary}</p>

      <div className="mb-5">
        <LinkButton to={`/play/computer?opening=${o.id}`} variant="outline">جرّب {o.name} ضد الكمبيوتر ←</LinkButton>
      </div>

      <OpeningViewer openingId={o.id} />

      <section aria-labelledby="story" className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft p-5">
        <h2 id="story" className="mb-2 font-display text-lg font-bold text-gold">نصيحة المدرب</h2>
        <p className="text-sm">
          متتحفظش الخط بالبلدي: العب {o.name} كذا دور وشوف الخصوم بيردوا إزاي. لو ردهم في الخط هنا، ارجع راجع
          النقلة اللي زاغوا عنها. لو ردهم بره الخط، خليك فاكر مبادئ الافتتاحية: تطوير، مركز، أمان الملك.
        </p>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 id="related" className="mb-2 font-display text-lg font-bold">فخاخ من نفس العيلة</h2>
          <ul className="space-y-1 text-sm">
            {related.map((t) => (
              <li key={t.id}>
                <Link href={`/traps/${t.id}`} className="text-gold hover:underline">{t.name}</Link>
                <span className="text-muted"> — {t.summary.slice(0, 60)}…</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="moves" className="mt-6">
        <h2 id="moves" className="mb-2 font-display text-lg font-bold">الخط الرئيسي كامل</h2>
        <p dir="ltr" className="rounded-xl border border-line bg-surface p-3 text-start font-mono text-sm">{pgn(o.moves)}</p>
        <ol className="mt-4 space-y-2">
          {o.moves.map((m, i) =>
            o.notes[i] ? (
              <li key={i} className="flex gap-3 rounded-lg p-2">
                <span dir="ltr" className="w-20 shrink-0 font-mono text-sm font-bold text-gold">
                  {Math.floor(i / 2) + 1}.{i % 2 ? '..' : ''} {m}
                </span>
                <span className="text-sm">{o.notes[i]}</span>
              </li>
            ) : null,
          )}
        </ol>
      </section>

      <nav aria-label="افتتاحيات تانية" className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/openings/${next.id}`} className="text-muted hover:text-gold">الافتتاحية الجاية: {next.name} ←</Link>
      </nav>
    </article>
  )
}
