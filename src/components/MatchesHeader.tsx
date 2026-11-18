'use client'

import { PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export default function MatchesHeader() {
  const en = useI18n().locale === 'en'
  return en ? (
    <PageHeader
      kicker="Elite games"
      title="Thousands of games from the top level online"
      desc="A big library of real games between 2500+ accounts (humans and engines) from the Lichess Elite Database, open CC0 data, every move checked with chess.js. Filter by opening, player or ECO letter and replay any game on the board."
    />
  ) : (
    <PageHeader
      kicker="ماتشات النخبة"
      title="آلاف الماتشات من أعلى مستوى أونلاين"
      desc="مكتبة ضخمة من ماتشات حقيقية بين حسابات 2500+ (بشر ومحركات) من Lichess Elite Database - بيانات مفتوحة CC0، كل نقلة متحقق منها بـ chess.js. فلتر بالافتتاحية أو اللاعب أو حرف ECO وشغّل أي ماتش على الرقعة."
    />
  )
}
