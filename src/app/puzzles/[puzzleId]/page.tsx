import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PuzzleSolver from '../../../components/PuzzleSolver'
import { Badge } from '../../../components/ui'
import { PUZZLES } from '../../../data/puzzles'

export const dynamicParams = false
export const generateStaticParams = () => PUZZLES.map((p) => ({ puzzleId: p.id }))

type Props = { params: Promise<{ puzzleId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).puzzleId
  const p = PUZZLES.find((x) => x.id === id)
  if (!p) return {}
  return {
    title: `لغز شطرنج: ${p.name} (${p.theme})`,
    description: p.text.replace(/`/g, ''),
    alternates: { canonical: `/puzzles/${p.id}` },
  }
}

export default async function PuzzlePage({ params }: Props) {
  const { puzzleId } = await params
  const idx = PUZZLES.findIndex((p) => p.id === puzzleId)
  if (idx < 0) notFound()
  const p = PUZZLES[idx]
  const next = PUZZLES[(idx + 1) % PUZZLES.length]
  return (
    <article>
      <nav aria-label="مسار الصفحة" className="mb-3 text-sm text-muted">
        <Link href="/puzzles" className="hover:text-gold">الألغاز</Link>
        <span className="mx-2">/</span>
        <span>{p.theme}</span>
      </nav>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{p.name}</h1>
        <Badge>{p.theme}</Badge>
        <Badge tone="muted">{p.level}</Badge>
      </div>
      <PuzzleSolver puzzleId={p.id} nextId={next.id} />
    </article>
  )
}
