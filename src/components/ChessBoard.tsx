'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Chessboard, defaultPieces, type Arrow } from 'react-chessboard'
import { Chess, type Square } from 'chess.js'
import { useSettings } from '../lib/settings'
import { isPromotionMove, kingSquareInCheck, type UciMove } from '../lib/chess'
import { useInStage } from './BoardStage'

export interface BoardArrow {
  from: string
  to: string
  color?: 'gold' | 'green' | 'red' | 'blue'
}

const ARROW_COLORS = {
  gold: 'rgba(222, 170, 60, 0.85)',
  green: 'rgba(40, 160, 100, 0.85)',
  red: 'rgba(220, 70, 50, 0.85)',
  blue: 'rgba(60, 130, 220, 0.85)',
}

export interface ChessBoardProps {
  fen: string
  orientation?: 'white' | 'black'
  /** which side the user may move; false = view only */
  movable?: 'w' | 'b' | 'both' | false
  /** parent validates; return true if the move was accepted */
  onMove?: (m: UciMove) => boolean
  lastMove?: [string, string] | null
  arrows?: BoardArrow[]
  highlights?: string[]
  marks?: Record<string, 'good' | 'bad'>
  className?: string
  shake?: number
}

export default function ChessBoard({
  fen,
  orientation = 'white',
  movable = 'both',
  onMove,
  lastMove,
  arrows,
  highlights,
  marks,
  className = '',
  shake = 0,
}: ChessBoardProps) {
  const id = useId().replace(/:/g, '')
  const { settings, boardTheme } = useSettings()
  const [selected, setSelected] = useState<string | null>(null)
  const [pendingPromo, setPendingPromo] = useState<{ from: string; to: string } | null>(null)
  const [shaking, setShaking] = useState(false)
  const inStage = useInStage()
  const rootRef = useRef<HTMLDivElement>(null)
  const [boardPx, setBoardPx] = useState(360)

  // coordinates scale a little with the board, like on chess.com: 9px on a phone, 12px at most
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setBoardPx(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const coordPx = Math.max(9, Math.min(12, Math.round(boardPx / 40)))

  const game = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return new Chess()
    }
  }, [fen])
  const turn = game.turn()
  const canMoveNow = movable === 'both' || movable === turn
  const interactive = !!onMove && canMoveNow

  // reset selection when the position changes
  useEffect(() => {
    setSelected(null)
    setPendingPromo(null)
  }, [fen])

  useEffect(() => {
    if (!shake) return
    setShaking(true)
    const t = setTimeout(() => setShaking(false), 460)
    return () => clearTimeout(t)
  }, [shake])

  const targets = useMemo(() => {
    if (!selected) return [] as { to: string; capture: boolean }[]
    return game
      .moves({ square: selected as Square, verbose: true })
      .map((m) => ({ to: m.to, capture: m.isCapture() }))
  }, [game, selected])

  function attempt(from: string, to: string): boolean {
    if (!onMove || !canMoveNow) return false
    if (isPromotionMove(fen, from, to)) {
      setPendingPromo({ from, to })
      return false
    }
    const ok = onMove({ from, to })
    setSelected(null)
    return ok
  }

  function ownPiece(square: string) {
    const p = game.get(square as Square)
    return !!p && p.color === turn && canMoveNow
  }

  const squareStyles: Record<string, CSSProperties> = {}
  if (lastMove) {
    for (const s of lastMove) squareStyles[s] = { background: 'rgba(235, 190, 70, 0.42)' }
  }
  for (const s of highlights ?? []) {
    squareStyles[s] = { ...squareStyles[s], boxShadow: 'inset 0 0 0 4px rgba(222, 170, 60, 0.9)' }
  }
  for (const [s, kind] of Object.entries(marks ?? {})) {
    squareStyles[s] = {
      ...squareStyles[s],
      background: kind === 'good' ? 'rgba(60, 170, 110, 0.55)' : 'rgba(220, 70, 50, 0.55)',
    }
  }
  const checkSq = kingSquareInCheck(fen)
  if (checkSq) {
    squareStyles[checkSq] = {
      ...squareStyles[checkSq],
      background: 'radial-gradient(circle, rgba(255, 40, 30, 0.9) 0%, rgba(230, 30, 20, 0.55) 35%, rgba(200, 0, 0, 0) 72%)',
    }
  }
  if (selected) {
    squareStyles[selected] = { ...squareStyles[selected], background: 'rgba(222, 170, 60, 0.6)' }
    if (settings.legalDots) {
      for (const t of targets) {
        squareStyles[t.to] = {
          ...squareStyles[t.to],
          background: t.capture
            ? 'radial-gradient(circle, transparent 58%, rgba(20, 20, 20, 0.28) 60%)'
            : 'radial-gradient(circle, rgba(20, 20, 20, 0.28) 22%, transparent 24%)',
          cursor: 'pointer',
        }
      }
    }
  }

  const boardArrows: Arrow[] = (arrows ?? []).map((a) => ({
    startSquare: a.from,
    endSquare: a.to,
    color: ARROW_COLORS[a.color ?? 'gold'],
  }))

  const promoColor = turn
  return (
    <div ref={rootRef} className={`ltr relative w-full select-none ${inStage ? 'board-bleed' : ''} ${shaking ? 'animate-shake' : ''} ${interactive ? '' : 'board-static'} ${className}`}>
      <div
        className="board-frame rounded-[14px] p-[6px] sm:p-2"
        style={{
          background: `linear-gradient(145deg, ${boardTheme.frame}, color-mix(in srgb, ${boardTheme.frame} 70%, black))`,
          boxShadow: '0 30px 60px -25px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <Chessboard
          options={{
            id: `b${id}`,
            position: fen,
            boardOrientation: orientation,
            showNotation: settings.coords,
            showAnimations: settings.animations,
            animationDurationInMs: 220,
            allowDragging: !!onMove && canMoveNow,
            allowDrawingArrows: true,
            arrows: boardArrows,
            clearArrowsOnPositionChange: true,
            boardStyle: { borderRadius: 'var(--board-radius, 8px)', overflow: 'hidden' },
            lightSquareStyle: { backgroundColor: boardTheme.light },
            darkSquareStyle: { backgroundColor: boardTheme.dark },
            // each coordinate takes the colour of the other square, small and quiet
            lightSquareNotationStyle: { color: boardTheme.dark },
            darkSquareNotationStyle: { color: boardTheme.light },
            alphaNotationStyle: { fontSize: `${coordPx}px`, fontWeight: 500, lineHeight: 1, bottom: 2, right: 3, opacity: 0.95 },
            numericNotationStyle: { fontSize: `${coordPx}px`, fontWeight: 500, lineHeight: 1, top: 3, left: 3, opacity: 0.95 },
            dropSquareStyle: { boxShadow: 'inset 0 0 0 4px rgba(222,170,60,0.85)' },
            squareStyles,
            canDragPiece: ({ square }) => !!square && ownPiece(square),
            onPieceDrag: ({ square }) => {
              if (square && ownPiece(square)) setSelected(square)
            },
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!targetSquare || sourceSquare === targetSquare) return false
              return attempt(sourceSquare, targetSquare)
            },
            onSquareClick: ({ square }) => {
              if (selected && targets.some((t) => t.to === square)) {
                attempt(selected, square)
                return
              }
              if (ownPiece(square)) setSelected(square === selected ? null : square)
              else setSelected(null)
            },
          }}
        />
      </div>

      {pendingPromo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[14px] bg-black/55 backdrop-blur-[2px]">
          <div className="animate-pop rounded-2xl border border-white/10 bg-[#1a1814] p-3 shadow-2xl" dir="rtl">
            <p className="mb-2 text-center text-sm text-[#f2eadb]">العسكري وصل! هترقيه لإيه؟</p>
            <div className="flex gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((p) => {
                const key = `${promoColor}${p.toUpperCase()}`
                const Piece = defaultPieces[key]
                return (
                  <button
                    key={p}
                    aria-label={{ q: 'وزير', r: 'طابية', b: 'فيل', n: 'حصان' }[p]}
                    className="h-16 w-16 rounded-xl bg-[#ecd9b5] p-1 transition hover:scale-105 hover:bg-[#f3e4c4]"
                    onClick={() => {
                      const pp = pendingPromo
                      setPendingPromo(null)
                      setSelected(null)
                      onMove?.({ from: pp.from, to: pp.to, promotion: p })
                    }}
                  >
                    <Piece />
                  </button>
                )
              })}
            </div>
            <button className="mt-2 w-full text-xs text-[#a99d88] hover:text-white" onClick={() => setPendingPromo(null)}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
