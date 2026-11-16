import type { ResultInfo } from '../chess'

type T = (key: string, vars?: Record<string, string | number>) => string

/** نص نتيجة الدور بلغة الصفحة (بدل النص العربي الثابت في gameResult). */
export function resultText(t: T, r: ResultInfo): string {
  if (!r.kind) return r.text
  if (r.kind === 'mate') return t('rs.mate', { side: t(r.winner === 'w' ? 'rs.white' : 'rs.black') })
  return t(`rs.${r.kind}`)
}
