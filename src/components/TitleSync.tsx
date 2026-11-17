'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '../lib/i18n'

const HOME_TITLE = 'Chesti | Learn chess from scratch'
const DESC = 'Learn chess step by step with lessons, tactics puzzles, openings, traps and famous games. Free.'

/** Keeps document.title and the description in step with the selected language (the static HTML is Arabic). */
export default function TitleSync() {
  const { locale } = useI18n()
  const path = usePathname()
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]')
    const d = document.documentElement.dataset
    if (locale !== 'en') {
      if (d.arTitle && document.title !== d.arTitle) document.title = d.arTitle
      if (d.arDesc && meta) meta.setAttribute('content', d.arDesc)
      return
    }
    d.arTitle = document.title
    if (meta) d.arDesc = meta.getAttribute('content') ?? ''
    const apply = () => {
      const h1 = document.querySelector('h1')?.textContent?.trim()
      const isHome = path === '/' || path === ''
      document.title = isHome || !h1 || /[\u0600-\u06FF]/.test(h1) ? (isHome ? HOME_TITLE : document.title) : `${h1} | Chesti`
      if (meta) meta.setAttribute('content', DESC)
    }
    apply()
    const ids = [150, 600, 1500, 3500].map((ms) => window.setTimeout(() => {
      document.documentElement.dataset.arTitle ??= ''
      apply()
    }, ms))
    return () => ids.forEach(clearTimeout)
  }, [locale, path])
  return null
}
