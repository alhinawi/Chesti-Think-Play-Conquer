'use client'

import type { ReactNode } from 'react'
import { SettingsProvider } from '../lib/settings'

export default function Providers({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}
