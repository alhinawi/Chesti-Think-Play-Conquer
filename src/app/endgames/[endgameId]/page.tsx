import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EndgamePlayer from '../../../components/EndgamePlayer'
import { Badge } from '../../../components/ui'
import { ENDGAMES } from '../../../data/endgames'

export const dynamicParams = false
export const generateStaticParams = () => ENDGAMES.map((e) => ({ endgameId: e.id }))

type Props = { params: Promise<{ endgameId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).endgameId
  const e = ENDGAMES.find((x) => x.id === id)
  if (!e) return {}
  return {
    title: `${e.name} (${e.en}) — معمل النهايات`,
    description: e.text,
    alternates: { canonical: `/endgames/${e.id}` },
    openGraph: { title: e.name, description: e.text, url: `/endgames/${e.id}`, type: 'article' },
  }
}

export default async function EndgamePage({ params }: Props) {
  const { endgameId } = await params
  const idx = ENDGAMES.findIndex((e) => e.id === endgameId)
  if (idx < 0) notFound()
  const e = ENDGAMES[idx]
  const next = ENDGAMES[(idx + 1) % ENDGAMES.length]
  return (
    <article>
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/endgames" className="hover:text-gold">معمل النهايات</Link>
        <span className="mx-2">/</span>
        <span>{e.theme}</span>
      </nav>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{e.name}</h1>
      <p className="text-sm text-muted" dir="ltr">{e.en}</p>
      <div className="mt-2 mb-3 flex flex-wrap gap-2">
        <Badge tone={e.level === 'سهل' ? 'emerald' : e.level === 'متوسط' ? 'gold' : 'danger'}>{e.level}</Badge>
        <Badge tone="muted">{e.theme}</Badge>
      </div>
      <p className="mb-5 max-w-3xl text-lg">{e.text}</p>

      <EndgamePlayer endgameId={e.id} nextId={next.id} />

      <nav aria-label="مواقف تانية" className="mt-10 border-t border-line pt-5 text-sm">
        <Link href={`/endgames/${next.id}`} className="text-muted hover:text-gold">الموقف الجاي: {next.name} ←</Link>
      </nav>
    </article>
  )
}
