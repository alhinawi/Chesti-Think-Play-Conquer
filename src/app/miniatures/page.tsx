import type { Metadata } from 'next'
import { PageHeader } from '../../components/ui'
import MiniaturesList from '../../components/MiniaturesList'
import { MINIATURES } from '../../data/miniatures'

export const metadata: Metadata = {
  title: 'ماتشات خاطفة - مات في أقل من 15 نقلة',
  description: `${MINIATURES.length} ماتش حقيقي قصير بين لاعبين 2500+ انتهى بكش مات على الرقعة: الغلطة القاتلة متعلم عليها ومتحقق منها بالمحرك، والشرح بالمصري نقلة بنقلة.`,
  alternates: { canonical: '/miniatures' },
}

export default function MiniaturesPage() {
  return (
    <>
      <PageHeader
        kicker="ماتشات خاطفة"
        title="ماتشات قصيرة، درس كبير"
        desc="ماتشات حقيقية بين لاعبين قويين (2500+ على Lichess) انتهت بكش مات على الرقعة في 6 لـ 14 نقلة. كل ماتش بيجاوب على سؤال واحد: إيه الغلطة اللي قلبته؟ الغلطة متعلم عليها بالأحمر ومتحقق منها بمحرك Stockfish، والبديل الصح مكتوب في الشرح."
      />
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <strong className="text-fg">الترتيب من الأقصر للأطول</strong> — كل الماتشات من Lichess Elite Database (بيانات مفتوحة CC0)، كل نقلة متحقق منها بـ chess.js، والمات النهائي مؤكد بالمحرك.
      </div>
      <MiniaturesList />
    </>
  )
}
