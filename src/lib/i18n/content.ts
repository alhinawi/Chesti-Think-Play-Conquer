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

type StepEn = { text: string; hint?: string; success?: string; notes?: Record<string, string> }
type LessonEn = { title: string; summary: string; steps: StepEn[] }
type LessonsEn = { chapters: Record<string, { title: string; desc: string }>; lessons: Record<string, LessonEn> }
type LessonLike = { id: string; title: string; summary: string; steps: any[] }
type ChapterLike = { id: string; title: string; desc: string }

let lcache: LessonsEn | null = null

/** Localized lesson/chapter text. Falls back to the original (Arabic) when a translation is missing. */
export function useLessonLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<LessonsEn | null>(lcache)
  useEffect(() => {
    if (locale !== 'en') return
    if (lcache) {
      setDict(lcache)
      return
    }
    void import('../../data/en/lessons.json').then((m) => {
      lcache = (m as any).default as LessonsEn
      setDict(lcache)
    })
  }, [locale])
  const en = locale === 'en' ? dict : null
  const lesson = useCallback(
    <T extends LessonLike>(l: T): T => {
      const h = en?.lessons[l.id]
      if (!h) return l
      return {
        ...l,
        title: h.title,
        summary: h.summary,
        steps: l.steps.map((s, i) => {
          const e = h.steps[i]
          if (!e) return s
          const out = { ...s, text: e.text }
          if (e.hint) out.hint = e.hint
          if (e.success) out.success = e.success
          if (e.notes) out.notes = { ...(s.notes ?? {}), ...Object.fromEntries(Object.entries(e.notes).map(([k, v]) => [Number(k), v])) }
          return out
        }),
      }
    },
    [en],
  )
  const chapter = useCallback(
    <T extends ChapterLike>(c: T): T => {
      const h = en?.chapters[c.id]
      return h ? { ...c, title: h.title, desc: h.desc } : c
    },
    [en],
  )
  const title = useCallback((id: string, fallback: string) => en?.lessons[id]?.title ?? fallback, [en])
  const chapterTitle = useCallback((id: string | undefined, fallback: string) => (id && en?.chapters[id]?.title) || fallback, [en])
  return { lesson, chapter, title, chapterTitle }
}

type OpeningEn = { name: string; summary: string; notes: Record<string, string>; planW: string; planB: string }
type OpeningLike = { id: string; name: string; summary: string; notes: Record<number, string>; planW: string; planB: string }
let ocache: Record<string, OpeningEn> | null = null

/** Localized opening text. Falls back to the original (Arabic) when a translation is missing. */
export function useOpeningLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<Record<string, OpeningEn> | null>(ocache)
  useEffect(() => {
    if (locale !== 'en') return
    if (ocache) {
      setDict(ocache)
      return
    }
    void import('../../data/en/openings.json').then((m) => {
      ocache = (m as any).default as Record<string, OpeningEn>
      setDict(ocache)
    })
  }, [locale])
  return useCallback(
    <T extends OpeningLike>(o: T): T => {
      const h = locale === 'en' && dict ? dict[o.id] : undefined
      if (!h) return o
      return { ...o, name: h.name, summary: h.summary, planW: h.planW, planB: h.planB, notes: { ...o.notes, ...Object.fromEntries(Object.entries(h.notes).map(([k, v]) => [Number(k), v])) } }
    },
    [locale, dict],
  )
}
