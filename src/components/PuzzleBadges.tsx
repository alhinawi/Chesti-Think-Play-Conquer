'use client'

import { Badge } from './ui'
import { useI18n } from '../lib/i18n'
import { themeSlug, levelSlug } from '../lib/i18n/dataLabels'

export default function PuzzleBadges({ theme, level }: { theme: string; level: string }) {
  const { t } = useI18n()
  const ts = themeSlug(theme)
  const ls = levelSlug(level)
  return (
    <>
      <Badge>{ts ? t(`pz.theme${ts[0].toUpperCase() + ts.slice(1)}`) : theme}</Badge>
      <Badge tone="muted">{ls ? t(`pz.level${ls}`) : level}</Badge>
    </>
  )
}
