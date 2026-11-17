import type { Metadata } from 'next'
import EncyclopediaBody from '../../components/EncyclopediaBody'
import { ARTICLES } from '../../data/encyclopedia'

export const metadata: Metadata = {
  title: 'موسوعة الشطرنج بالعربي',
  description: `${ARTICLES.length} مقال شطرنج بالمصري: قواعد اللعبة، وأشهر الافتتاحات زي الإيطالية والصقلية، والتكتيك، والاستراتيجية، والنهايات، وتاريخ الشطرنج.`,
  alternates: { canonical: '/encyclopedia' },
  openGraph: { title: 'موسوعة الشطرنج', url: '/encyclopedia' },
}

export default function EncyclopediaPage() {
  return <EncyclopediaBody />
}
