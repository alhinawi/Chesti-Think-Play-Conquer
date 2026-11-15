'use client'

import type { ReactNode } from 'react'
import { SettingsProvider } from '../lib/settings'
import { I18nProvider } from '../lib/i18n'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <I18nProvider>{children}</I18nProvider>
    </SettingsProvider>
  )
}
