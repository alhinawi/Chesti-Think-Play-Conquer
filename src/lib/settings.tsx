'use client'

import { setSoundEnabled } from './sound'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type BoardThemeId = 'walnut' | 'emerald' | 'onyx' | 'marble' | 'ocean'

export interface BoardTheme {
  id: BoardThemeId
  name: string
  light: string
  dark: string
  frame: string
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'walnut', name: 'خشب جوز', light: '#ecd9b5', dark: '#a87a50', frame: '#5b3d22' },
  { id: 'emerald', name: 'زمرد', light: '#eeeed2', dark: '#5f8c63', frame: '#2c4a32' },
  { id: 'onyx', name: 'أسود ودهب', light: '#d9c89b', dark: '#3a352c', frame: '#1a1712' },
  { id: 'marble', name: 'رخام', light: '#f1ede4', dark: '#9b9488', frame: '#5c574e' },
  { id: 'ocean', name: 'بحري', light: '#dee3e6', dark: '#7c95ab', frame: '#3b5266' },
]

export interface Settings {
  theme: 'dark' | 'light'
  board: BoardThemeId
  sound: boolean
  coords: boolean
  legalDots: boolean
  animations: boolean
}

const DEFAULTS: Settings = {
  theme: 'dark',
  board: 'walnut',
  sound: true,
  coords: true,
  legalDots: true,
  animations: true,
}

export const SETTINGS_KEY = 'chesti-settings'
const KEY = SETTINGS_KEY

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

/** Runs before paint (inline in <head>) so the saved theme never flashes. */
export const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('${SETTINGS_KEY}')||'{}');if(s.theme==='light')document.documentElement.classList.remove('dark')}catch(e){}`

interface Ctx {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  boardTheme: BoardTheme
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [ready, setReady] = useState(false)

  // Static HTML is rendered with the defaults; the saved settings load after hydration.
  useEffect(() => {
    setSettings(load())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(KEY, JSON.stringify(settings))
    setSoundEnabled(settings.sound)
    const root = document.documentElement
    root.classList.toggle('dark', settings.theme === 'dark')
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', settings.theme === 'dark' ? '#0e0d0b' : '#f6f1e7')
  }, [settings, ready])

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const boardTheme = BOARD_THEMES.find((t) => t.id === settings.board) ?? BOARD_THEMES[0]
  const value = useMemo(() => ({ settings, update, boardTheme }), [settings, update, boardTheme])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings outside provider')
  return ctx
}
