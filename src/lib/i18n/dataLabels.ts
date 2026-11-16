// Slug maps for data-driven labels (puzzle themes, levels) so UI can
// localize them through the message catalogs. Unknown values fall back to
// the raw (Arabic) data string.
const THEME_SLUGS: Record<string, string> = {
  'مات في نقلة': 'mate1',
  'مات في نقلتين': 'mate2',
  'مات في 3 نقلات': 'mate3',
  'شوكة': 'fork',
  'تثبيت': 'pin',
  'سيخ': 'skewer',
  'هجوم مكشوف': 'discovered',
  'كش مكتشف': 'discoveredCheck',
  'كش مزدوج': 'doubleCheck',
  'ترقية': 'promotion',
  'ترقية عسكري': 'pawnPromotion',
  'إزاحة/تشتيت': 'deflection',
  'نهايات رابحة': 'winningEndgame',
  'تحميل زائد': 'overloading',
  'تضحية': 'sacrifice',
}
const LEVEL_SLUGS: Record<string, string> = {
  'سهل': 'Easy',
  'متوسط': 'Medium',
  'متقدم': 'Advanced',
}
export const themeSlug = (theme: string) => THEME_SLUGS[theme]
export const levelSlug = (level: string) => LEVEL_SLUGS[level]
