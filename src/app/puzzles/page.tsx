import type { Metadata } from 'next'
import PuzzleList from '../../components/PuzzleList'
import PuzzlesHeader from '../../components/PuzzlesHeader'
import { PUZZLES } from '../../data/puzzles'

export const metadata: Metadata = {
  title: 'ألغاز شطرنج محلولة ومشروحة',
  description: `${PUZZLES.length} لغز شطرنج بالمصري: مات في نقلة ونقلتين، شوكة، تثبيت، سيخ، ونهايات أدوار مشهورة زي مباراة الأوبرا.`,
  alternates: { canonical: '/puzzles' },
}

export default function PuzzlesPage() {
  return (
    <>
      <PuzzlesHeader />
      <PuzzleList />
    </>
  )
}
