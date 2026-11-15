'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_LOCALE, LANG_KEY, LOCALES, detectLocale, localeDir, type LocaleId } from './config'
import EG, { type Catalog, type Messages } from './messages/eg'

const LOADERS: Record<LocaleId, () => Promise<{ default: Catalog }>> = {
  eg: () => Promise.resolve({ default: EG }),
  gulf: () => import('./messages/gulf') as Promise<{ default: Catalog }>,
  levant: () => import('./messages/levant') as Promise<{ default: Catalog }>,
  maghreb: () => import('./messages/maghreb') as Promise<{ default: Catalog }>,
  msa: () => import('./messages/msa') as Promise<{ default: Catalog }>,
  en: () => import('./messages/en') as Promise<{ default: Catalog }>,
  fr: () => import('./messages/fr') as Promise<{ default: Catalog }>,
  de: () => import('./messages/de') as Promise<{ default: Catalog }>,
  es: () => import('./messages/es') as Promise<{ default: Catalog }>,
  tr: () => import('./messages/tr') as Promise<{ default: Catalog }>,
}

function merge<T>(base: T, over: unknown): T {
  if (over == null) return base
  if (typeof base !== 'object' || base === null) return (over as T) ?? base
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = k in out ? merge(out[k], v) : v
  }
  return out as T
}

function lookup(obj: unknown, path: string): string | undefined {
  let cur = obj
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

interface I18nCtx {
  locale: LocaleId
  dir: 'rtl' | 'ltr'
  setLocale: (id: LocaleId, remember?: boolean) => void
  /** translate a dotted key; {name} placeholders come from vars */
  t: (key: string, vars?: Record<string, string | number>) => string
  locales: typeof LOCALES
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(DEFAULT_LOCALE)
  const [messages, setMessages] = useState<Messages>(EG)
  const cache = useRef<Partial<Record<LocaleId, Messages>>>({ eg: EG })

  const apply = useCallback(async (id: LocaleId) => {
    setLocaleState(id)
    const dir = localeDir(id)
    document.documentElement.dir = dir
    document.documentElement.lang = dir === 'rtl' ? 'ar' : id
    const cachedMsg = cache.current[id]
    if (cachedMsg) {
      setMessages(cachedMsg)
      return
    }
    try {
      const mod = await LOADERS[id]()
      const merged = merge(EG, mod.default)
      cache.current[id] = merged
      setMessages(merged)
    } catch {
      /* الافتراضي شغال */
    }
  }, [])

  // أول تحميل: المحفوظ، وإلا التخمين من المتصفح/المنطقة الزمنية
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(LANG_KEY)
    } catch {
      /* ignore */
    }
    const initial = (LOCALES.some((l) => l.id === saved) ? (saved as LocaleId) : null) ?? detectLocale()
    void apply(initial)
  }, [apply])

  const setLocale = useCallback(
    (id: LocaleId, remember = true) => {
      if (remember) {
        try {
          localStorage.setItem(LANG_KEY, id)
        } catch {
          /* ignore */
        }
      }
      void apply(id)
    },
    [apply],
  )

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = lookup(messages, key) ?? lookup(EG, key) ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v))
      return str
    },
    [messages],
  )

  const value = useMemo(() => ({ locale, dir: localeDir(locale), setLocale, t, locales: LOCALES }), [locale, setLocale, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}

export { LOCALES, type LocaleId }
