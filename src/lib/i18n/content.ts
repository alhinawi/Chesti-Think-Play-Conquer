'use client'

import { useCallback, useEffect, useState } from 'react'
import { useI18n } from './index'

type PuzzleLike = { id: string; name: string; text: string; explain: string }
type Dict = Record<string, [string, string, string]>

let cache: Dict | null = null

/** Localized puzzle name/text/explain. Falls back to the original (Arabic) when a translation is missing. */
export function usePuzzleLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<Dict | null>(cache)
  useEffect(() => {
    if (locale !== 'en') return
    if (cache) {
      setDict(cache)
      return
    }
    void import('../../data/en/puzzles').then((m) => {
      cache = m.PUZZLES_EN
      setDict(cache)
    })
  }, [locale])
  return useCallback(
    (p: PuzzleLike) => {
      const hit = locale === 'en' && dict ? dict[p.id] : undefined
      return hit ? { name: hit[0], text: hit[1], explain: hit[2] } : { name: p.name, text: p.text, explain: p.explain }
    },
    [locale, dict],
  )
}
