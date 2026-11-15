'use client'

import { useI18n } from '../lib/i18n'
import { Icon } from './ui'

export default function LangSwitcher() {
  const { locale, setLocale, locales, t } = useI18n()
  return (
    <label className="relative flex items-center">
      <Icon name="globe" className="pointer-events-none absolute start-2 h-4 w-4 text-muted" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        aria-label={t('aria.language')}
        className="h-10 appearance-none rounded-lg border border-line bg-surface ps-8 pe-2 text-sm font-bold text-ink"
      >
        {locales.map((l) => (
          <option key={l.id} value={l.id}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  )
}
