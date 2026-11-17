'use client'

import { useCallback, useEffect, useState } from 'react'
import { useI18n } from './index'
import { BOTS_EN, W3_EN } from '../../data/en/bots-w3'
import { ACH_EN, RANK_EN } from '../../data/en/ui-misc'

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

type TrapEn = { name: string; opening: string; summary: string; avoid: string; notes: Record<string, string> }
type TrapLike = { id: string; name: string; opening: string; summary: string; avoid: string; notes: string[] }
let tcache: Record<string, TrapEn> | null = null

/** Localized trap text. Falls back to the original (Arabic) when a translation is missing. */
export function useTrapLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<Record<string, TrapEn> | null>(tcache)
  useEffect(() => {
    if (locale !== 'en') return
    if (tcache) {
      setDict(tcache)
      return
    }
    void import('../../data/en/traps.json').then((m) => {
      tcache = (m as any).default as Record<string, TrapEn>
      setDict(tcache)
    })
  }, [locale])
  return useCallback(
    <T extends TrapLike>(t: T): T => {
      const h = locale === 'en' && dict ? dict[t.id] : undefined
      if (!h) return t
      const notes = t.notes.map((n, i) => h.notes[String(i)] ?? n)
      return { ...t, name: h.name, opening: h.opening, summary: h.summary, avoid: h.avoid, notes }
    },
    [locale, dict],
  )
}

type EndgameEn = { name: string; theme: string; text: string; explain: string }
type EndgameLike = { id: string; name: string; theme: string; text: string; explain: string }
let ecache: Record<string, EndgameEn> | null = null

/** Localized endgame text. Falls back to the original (Arabic) when a translation is missing. */
export function useEndgameLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<Record<string, EndgameEn> | null>(ecache)
  useEffect(() => {
    if (locale !== 'en') return
    if (ecache) {
      setDict(ecache)
      return
    }
    void import('../../data/en/endgames.json').then((m) => {
      ecache = (m as any).default as Record<string, EndgameEn>
      setDict(ecache)
    })
  }, [locale])
  return useCallback(
    <T extends EndgameLike>(e: T): T => {
      const h = locale === 'en' && dict ? dict[e.id] : undefined
      return h ? { ...e, ...h } : e
    },
    [locale, dict],
  )
}

type GameEn = { name: string; white: string; black: string; place: string; summary: string; notes: Record<string, string>; lesson: string }
type GameLike = { id: string; name: string; white: string; black: string; place: string; summary: string; notes: Record<number, string>; lesson: string }
let gcache: Record<string, GameEn> | null = null

/** Localized famous-game text. Falls back to the original (Arabic) when a translation is missing. */
export function useGameLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<Record<string, GameEn> | null>(gcache)
  useEffect(() => {
    if (locale !== 'en') return
    if (gcache) {
      setDict(gcache)
      return
    }
    void import('../../data/en/games.json').then((m) => {
      gcache = (m as any).default as Record<string, GameEn>
      setDict(gcache)
    })
  }, [locale])
  return useCallback(
    <T extends GameLike>(g: T): T => {
      const h = locale === 'en' && dict ? dict[g.id] : undefined
      if (!h) return g
      const notes: Record<number, string> = { ...g.notes }
      for (const k of Object.keys(g.notes)) notes[Number(k)] = h.notes[k] ?? g.notes[Number(k)]
      return { ...g, name: h.name, white: h.white, black: h.black, place: h.place, summary: h.summary, lesson: h.lesson, notes }
    },
    [locale, dict],
  )
}

type EncEn = Record<string, any>
let enccache: EncEn | null = null

/** Localized encyclopedia: articles, categories and glossary. Falls back to the original (Arabic). */
export function useEncLoc() {
  const { locale } = useI18n()
  const [dict, setDict] = useState<EncEn | null>(enccache)
  useEffect(() => {
    if (locale !== 'en') return
    if (enccache) {
      setDict(enccache)
      return
    }
    void import('../../data/en/encyclopedia.json').then((m) => {
      enccache = (m as any).default as EncEn
      setDict(enccache)
    })
  }, [locale])
  const d = locale === 'en' ? dict : null
  const article = useCallback(
    <T extends { id: string; title: string; summary: string; tags?: string[]; blocks: any[] }>(a: T): T => {
      const h = d?.[a.id] as Record<string, string> | undefined
      if (!h) return a
      const g = (k: unknown, fb: string) => h[JSON.stringify(k)] ?? fb
      const blocks = a.blocks.map((b: any, i: number) => {
        if ('h' in b) return { h: g([i, 'h'], b.h) }
        if ('p' in b) return { p: g([i, 'p'], b.p) }
        if ('list' in b) return { list: b.list.map((x: string, j: number) => g([i, 'l', j], x)) }
        if ('board' in b) return { board: { ...b.board, caption: g([i, 'bc'], b.board.caption) } }
        if ('line' in b) return { line: { ...b.line, caption: g([i, 'lc'], b.line.caption) } }
        return b
      })
      return { ...a, title: g('title', a.title), summary: g('summary', a.summary), tags: a.tags?.map((t, i) => g(['tag', i], t)), blocks }
    },
    [d],
  )
  const category = useCallback(
    <T extends { id: string; name: string; desc: string }>(c: T): T => {
      const h = d?._cats?.[c.id] as [string, string] | undefined
      return h ? { ...c, name: h[0], desc: h[1] } : c
    },
    [d],
  )
  const termDef = useCallback((i: number, fb: string): string => (d?._terms?.[i] as string | undefined) ?? fb, [d])
  return { article, category, termDef }
}

type BotLike = { id: string; tagline: string; greet: string; wins: string; loses: string; checked: string }

/** Localized computer-opponent lines. Falls back to the original (Arabic). */
export function useBotLoc() {
  const { locale } = useI18n()
  return useCallback(
    <T extends BotLike>(b: T): T => {
      const h = locale === 'en' ? BOTS_EN[b.id] : undefined
      return h ? { ...b, ...h } : b
    },
    [locale],
  )
}

/** Localized 3D position names and stories. Falls back to the original (Arabic). */
export function useW3Loc() {
  const { locale } = useI18n()
  return useCallback(
    <T extends { id: string; name: string; story: string }>(p: T): T => {
      const h = locale === 'en' ? W3_EN[p.id] : undefined
      return h ? { ...p, ...h } : p
    },
    [locale],
  )
}

/** Localized rank and achievement names. Falls back to the original (Arabic). */
export function useRankLoc() {
  const { locale } = useI18n()
  const rank = useCallback((name: string) => (locale === 'en' ? RANK_EN[name] ?? name : name), [locale])
  const ach = useCallback(
    <T extends { id: string; name: string; desc: string }>(a: T): T => {
      const h = locale === 'en' ? ACH_EN[a.id] : undefined
      return h ? { ...a, name: h[0], desc: h[1] } : a
    },
    [locale],
  )
  return { rank, ach }
}
