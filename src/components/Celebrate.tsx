'use client'

import { useEffect, useState } from 'react'

const EVENT = 'chesti:celebrate'

/** Fire the gold confetti from anywhere. */
export function celebrate(big = false) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT, { detail: { big } }))
}

const COLORS = ['#d9b56b', '#f0d391', '#4fb58f', '#f2eadb', '#a87b2f']
const GLYPHS = ['♛', '♞', '♜', '♝']

interface Piece {
  id: number
  left: number
  delay: number
  dur: number
  drift: number
  rot: number
  color: string
  glyph?: string
  size: number
}

function burst(n: number, seed: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: seed + i,
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    dur: 1.6 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 160,
    rot: (Math.random() - 0.5) * 900,
    color: COLORS[i % COLORS.length],
    glyph: i % 7 === 0 ? GLYPHS[i % GLYPHS.length] : undefined,
    size: 6 + Math.random() * 7,
  }))
}

/** Mounted once in the shell; listens for celebrate(). Skipped for reduced motion. */
export default function Celebrate() {
  const [pieces, setPieces] = useState<Piece[]>([])
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const on = (e: Event) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const big = (e as CustomEvent<{ big?: boolean }>).detail?.big
      setPieces(burst(big ? 90 : 45, Date.now()))
      clearTimeout(timer)
      timer = setTimeout(() => setPieces([]), 3400)
    }
    window.addEventListener(EVENT, on)
    return () => {
      window.removeEventListener(EVENT, on)
      clearTimeout(timer)
    }
  }, [])
  if (!pieces.length) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              '--drift': `${p.drift}px`,
              '--rot': `${p.rot}deg`,
              color: p.color,
              background: p.glyph ? 'transparent' : p.color,
              width: p.glyph ? 'auto' : p.size,
              height: p.glyph ? 'auto' : p.size * 0.45,
              fontSize: p.glyph ? p.size * 2.4 : undefined,
            } as React.CSSProperties
          }
        >
          {p.glyph}
        </span>
      ))}
    </div>
  )
}
