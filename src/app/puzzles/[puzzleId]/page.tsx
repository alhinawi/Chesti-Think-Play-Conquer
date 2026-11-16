import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PuzzleSolver from '../../../components/PuzzleSolver'
import PuzzleTitle from '../../../components/PuzzleTitle'
import PuzzleCrumb from '../../../components/PuzzleCrumb'
import PuzzleBadges from '../../../components/PuzzleBadges'
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
      <PuzzleCrumb theme={p.theme} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PuzzleTitle p={p} />
        <PuzzleBadges theme={p.theme} level={p.level} />
      </div>
      <PuzzleSolver puzzleId={p.id} nextId={next.id} />
    </article>
  )
}
