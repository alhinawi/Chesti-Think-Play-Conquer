import type { Metadata } from 'next'
import CreditsBody from '../../components/CreditsBody'

export const metadata: Metadata = {
  title: 'حقوق الصور',
  description: 'مصادر وتراخيص صور اللاعبين المشاهير المستخدمة في Chesti - كلها صور حرة الترخيص من Wikimedia Commons.',
  alternates: { canonical: '/credits' },
  robots: { index: false },
}

export default function CreditsPage() {
  return <CreditsBody />
}
