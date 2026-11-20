'use client'

import { setSoundEnabled, setSoundPack, setSoundVolume, type SoundPackId } from './sound'
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
  /** حزمة أصوات القطع */
  soundPack: SoundPackId
  /** درجة الصوت 0-100 */
  soundVolume: number
  coords: boolean
  legalDots: boolean
  animations: boolean
  /** settings format; 3 = sound packs + volume */
  v?: number
}

const DEFAULTS: Settings = {
  theme: 'dark',
  board: 'marble',
  sound: true,
  soundPack: 'wood',
  soundVolume: 80,
  coords: true,
  legalDots: true,
  animations: true,
  v: 3,
}

export const SETTINGS_KEY = 'chesti-settings'
const KEY = SETTINGS_KEY

function load(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Settings>
    // Before v2 every visit saved the old default (walnut) as if it had been chosen: move those to the new default.
    if (!saved.v && saved.board === 'walnut') delete saved.board
    return { ...DEFAULTS, ...saved, v: 3 }
  } catch {
    return DEFAULTS
  }
}

/** Runs before paint (inline in <head>) so the saved theme never flashes. */
export const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('${SETTINGS_KEY}')||'{}');var r=document.documentElement;if(s.theme==='light')r.classList.remove('dark');var T=${JSON.stringify(Object.fromEntries(BOARD_THEMES.map((t) => [t.id, [t.light, t.dark, t.frame]])))};var b=s.board;if(!s.v&&b==='walnut')b=null;var t=T[b||'${DEFAULTS.board}'];if(t){r.style.setProperty('--bd-light',t[0]);r.style.setProperty('--bd-dark',t[1]);r.style.setProperty('--bd-frame',t[2])}}catch(e){}`

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
    setSoundPack(settings.soundPack)
    setSoundVolume(settings.soundVolume / 100)
    const root = document.documentElement
    root.classList.toggle('dark', settings.theme === 'dark')
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', settings.theme === 'dark' ? '#0e0d0b' : '#f6f1e7')
  }, [settings, ready])

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])
  const found = BOARD_THEMES.find((t) => t.id === settings.board) ?? BOARD_THEMES[0]
  // Until the saved settings load, paint from the CSS variables the boot script set, so the board never flashes the default theme.
  const boardTheme = useMemo<BoardTheme>(
    () => (ready ? found : { ...found, light: `var(--bd-light, ${found.light})`, dark: `var(--bd-dark, ${found.dark})`, frame: `var(--bd-frame, ${found.frame})` }),
    [ready, found],
  )
  const value = useMemo(() => ({ settings, update, boardTheme }), [settings, update, boardTheme])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings outside provider')
  return ctx
}
