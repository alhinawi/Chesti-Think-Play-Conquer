'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon } from './ui'

const StageCtx = createContext(false)
/** True for a board inside a play stage: it goes edge to edge on phones. */
export const useInStage = () => useContext(StageCtx)

type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

/**
 * Holds the board of a game (with its player bars) and makes it as big as the screen allows:
 * edge to edge on phones, as tall as fits on tablets and desktops, and a true fullscreen mode
 * (Fullscreen API, or a fixed overlay where the API is missing, as on iPhone Safari).
 * `reserve` / `fsReserve` are the rem of height kept free for the bars and buttons around the board.
 */
export default function BoardStage({
  children,
  fsExtras,
  reserve = 15,
  fsReserve = 14,
}: {
  children: ReactNode
  /** shown under the board only in fullscreen, so the game's buttons stay at hand */
  fsExtras?: ReactNode
  reserve?: number
  fsReserve?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'off' | 'native' | 'css'>('off')

  useEffect(() => {
    const onChange = () => {
      const d = document as FsDoc
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null
      setMode((m) => (el && el === ref.current ? 'native' : m === 'native' ? 'off' : m))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // overlay fallback: stop the page behind from scrolling, and let Escape close it
  useEffect(() => {
    if (mode !== 'css') return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('off')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mode])

  const enter = useCallback(async () => {
    const el = ref.current as FsEl | null
    if (!el) return
    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' })
        return
      }
      if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen()
        const d = document as FsDoc
        if (d.webkitFullscreenElement === el) return
      }
    } catch {
      /* the browser refused: use the overlay */
    }
    setMode('css')
  }, [])

  const exit = useCallback(() => {
    const d = document as FsDoc
    if (mode === 'native') {
      if (d.fullscreenElement && d.exitFullscreen) void d.exitFullscreen().catch(() => setMode('off'))
      else if (d.webkitFullscreenElement && d.webkitExitFullscreen) void d.webkitExitFullscreen()
      else setMode('off')
      return
    }
    setMode('off')
  }, [mode])

  const fs = mode !== 'off'
  return (
    <StageCtx.Provider value>
      <div
        ref={ref}
        className={`board-stage${fs ? ' is-fs' : ''}`}
        style={{ '--board-reserve': `${reserve}rem`, '--board-fs-reserve': `${fsReserve}rem` } as CSSProperties}
        role={fs ? 'dialog' : undefined}
        aria-modal={fs || undefined}
        aria-label={fs ? 'الرقعة في ملء الشاشة' : undefined}
      >
        {fs && (
          <div className="board-stage-bar">
            <button
              type="button"
              onClick={exit}
              aria-label="اخرج من ملء الشاشة"
              title="اخرج من ملء الشاشة"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink hover:bg-gold-soft"
            >
              <Icon name="shrink" className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="board-stage-inner flex flex-col gap-2">
          {children}
          {fs && fsExtras}
          {!fs && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={enter}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="expand" className="h-4 w-4" /> ملء الشاشة
              </button>
            </div>
          )}
        </div>
      </div>
    </StageCtx.Provider>
  )
}
