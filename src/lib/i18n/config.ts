// لغات الموقع: مصري (الافتراضي)، خليجي، شامي، مغربي، فصحى، وإنجليزي/فرنسي/ألماني/إسباني/تركي.
export type LocaleId = 'eg' | 'gulf' | 'levant' | 'maghreb' | 'msa' | 'en' | 'fr' | 'de' | 'es' | 'tr'

export interface LocaleInfo {
  id: LocaleId
  /** الاسم بلغته (بيظهر في المبدّل) */
  native: string
  dir: 'rtl' | 'ltr'
}

export const LOCALES: LocaleInfo[] = [
  { id: 'eg', native: 'مصري', dir: 'rtl' },
  { id: 'gulf', native: 'خليجي', dir: 'rtl' },
  { id: 'levant', native: 'شامي', dir: 'rtl' },
  { id: 'maghreb', native: 'مغربي', dir: 'rtl' },
  { id: 'msa', native: 'العربية الفصحى', dir: 'rtl' },
  { id: 'en', native: 'English', dir: 'ltr' },
  { id: 'fr', native: 'Français', dir: 'ltr' },
  { id: 'de', native: 'Deutsch', dir: 'ltr' },
  { id: 'es', native: 'Español', dir: 'ltr' },
  { id: 'tr', native: 'Türkçe', dir: 'ltr' },
]

export const DEFAULT_LOCALE: LocaleId = 'eg'
export const LANG_KEY = 'chesti-lang'

export function localeDir(id: LocaleId): 'rtl' | 'ltr' {
  return LOCALES.find((l) => l.id === id)?.dir ?? 'rtl'
}

const LANG_MAP: [RegExp, LocaleId][] = [
  [/^ar-EG/i, 'eg'],
  [/^ar-(SA|AE|KW|QA|BH|OM|YE|IQ)/i, 'gulf'],
  [/^ar-(SY|LB|JO|PS)/i, 'levant'],
  [/^ar-(MA|DZ|TN|LY|MR)/i, 'maghreb'],
  [/^ar/i, 'msa'],
  [/^en/i, 'en'],
  [/^fr/i, 'fr'],
  [/^de/i, 'de'],
  [/^es/i, 'es'],
  [/^tr/i, 'tr'],
]

const TZ_MAP: Record<string, LocaleId> = {
  'Africa/Cairo': 'eg',
  'Asia/Riyadh': 'gulf',
  'Asia/Dubai': 'gulf',
  'Asia/Qatar': 'gulf',
  'Asia/Bahrain': 'gulf',
  'Asia/Kuwait': 'gulf',
  'Asia/Muscat': 'gulf',
  'Asia/Aden': 'gulf',
  'Asia/Baghdad': 'gulf',
  'Asia/Damascus': 'levant',
  'Asia/Beirut': 'levant',
  'Asia/Amman': 'levant',
  'Asia/Jerusalem': 'levant',
  'Asia/Hebron': 'levant',
  'Asia/Gaza': 'levant',
  'Africa/Casablanca': 'maghreb',
  'Africa/El_Aaiun': 'maghreb',
  'Africa/Algiers': 'maghreb',
  'Africa/Tunis': 'maghreb',
  'Africa/Tripoli': 'maghreb',
  'Europe/Istanbul': 'tr',
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
export const LANG_BOOT_SCRIPT = `try{var l=localStorage.getItem('${LANG_KEY}');var D={eg:1,gulf:1,levant:1,maghreb:1,msa:1};if(l){document.documentElement.dir=D[l]?'rtl':'ltr';document.documentElement.lang=l==='eg'||l==='gulf'||l==='levant'||l==='maghreb'||l==='msa'?'ar':l}}catch(e){}`
