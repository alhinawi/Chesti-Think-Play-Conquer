import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'
import PuzzleList from '../../components/PuzzleList'
import { PUZZLES } from '../../data/puzzles'

export const metadata: Metadata = {
  title: 'ألغاز شطرنج محلولة ومشروحة',
  description: `${PUZZLES.length} لغز شطرنج بالمصري: مات في نقلة ونقلتين، شوكة، تثبيت، سيخ، ونهايات أدوار مشهورة زي مباراة الأوبرا.`,
  alternates: { canonical: '/puzzles' },
}

export default function PuzzlesPage() {
  return (
    <>
      <PageHeader kicker="الألغاز" title="شغّل مخك" desc="كل لغز متراجع بمحرك Stockfish: الحل اللي هنا هو أحسن نقلة فعلًا." />
      <PuzzleList />
    </>
  )
}
