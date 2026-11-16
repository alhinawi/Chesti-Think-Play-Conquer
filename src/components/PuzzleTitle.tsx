'use client'

import { usePuzzleLoc } from '../lib/i18n/content'

export default function PuzzleTitle({ p }: { p: { id: string; name: string; text: string; explain: string } }) {
  const lp = usePuzzleLoc()
  return <h1 className="font-display text-2xl font-bold sm:text-3xl">{lp(p).name}</h1>
}
