// لغات الموقع: العربية (مصري، الافتراضي) وإنجليزي بس.
export type LocaleId = 'eg' | 'gulf' | 'levant' | 'maghreb' | 'msa' | 'en' | 'fr' | 'de' | 'es' | 'tr'

export interface LocaleInfo {
  id: LocaleId
  /** الاسم بلغته (بيظهر في المبدّل) */
  native: string
  dir: 'rtl' | 'ltr'
}

export const LOCALES: LocaleInfo[] = [
  { id: 'eg', native: 'العربية', dir: 'rtl' },
  { id: 'en', native: 'English', dir: 'ltr' },
]

export const DEFAULT_LOCALE: LocaleId = 'eg'
export const LANG_KEY = 'chesti-lang'

export function localeDir(id: LocaleId): 'rtl' | 'ltr' {
  return LOCALES.find((l) => l.id === id)?.dir ?? 'rtl'
}

const LANG_MAP: [RegExp, LocaleId][] = [
  [/^ar/i, 'eg'],
  [/^en/i, 'en'],
]

const TZ_MAP: Record<string, LocaleId> = {
  'Africa/Cairo': 'eg',
}

/** يخمّن اللغة من تفضيلات المتصفح، وبعدين المنطقة الزمنية كدليل مساعد. */
export function detectLocale(): LocaleId {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of langs) {
    if (!lang) continue
    for (const [re, id] of LANG_MAP) if (re.test(lang)) return id
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && TZ_MAP[tz]) return TZ_MAP[tz]
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

/** بيتنفذ قبل الرسم عشان الاتجاه المحفوظ ما يعملش قفزة. */
export const LANG_BOOT_SCRIPT = `try{var l=localStorage.getItem('${LANG_KEY}');if(l){document.documentElement.dir=l==='en'?'ltr':'rtl';document.documentElement.lang=l==='en'?'en':'ar'}}catch(e){}`
