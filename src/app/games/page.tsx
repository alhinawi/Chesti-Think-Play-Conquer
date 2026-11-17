import type { Metadata } from 'next'
import { GamesHeader } from '../../components/DailyHeaders'
import GamesList from '../../components/GamesList'
import { GAMES } from '../../data/games'

export const metadata: Metadata = {
  title: 'أدوار خالدة',
  description: `${GAMES.length} من أشهر أدوار الشطرنج في التاريخ معروضة نقلة بنقلة بشرح مصري: مورفي وأندرسن وفيشر وكاسباروف.`,
  alternates: { canonical: '/games' },
}

export default function GamesPage() {
  return (
    <>
      <GamesHeader count={GAMES.length} />

      <GamesList />
    </>
  )
}
