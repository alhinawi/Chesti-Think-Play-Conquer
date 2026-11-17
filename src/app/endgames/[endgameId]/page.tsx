import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import EndgamePageBody from '../../../components/EndgamePageBody'
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
      <EndgamePageBody endgameId={e.id} nextId={next.id} />
    </article>
  )
}
