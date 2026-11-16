import { Chess, type Move, type Square } from 'chess.js'
import { play } from './sound'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface UciMove {
  from: string
  to: string
  promotion?: string
}

export function parseUci(uci: string): UciMove {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined }
}

export function toUci(m: { from: string; to: string; promotion?: string }) {
  return m.from + m.to + (m.promotion ?? '')
}

/** Try a move on a copy of the position. Returns the new game + move or null. */
export function tryMove(fen: string, m: UciMove | string): { game: Chess; move: Move } | null {
  const game = new Chess(fen)
  try {
    const move = game.move(typeof m === 'string' ? m : { from: m.from, to: m.to, promotion: m.promotion })
    return move ? { game, move } : null
  } catch {
    return null
  }
}

export function soundFor(move: Move, game: Chess) {
  if (game.isGameOver()) return play('end')
  if (game.inCheck()) return play('check')
  if (move.isPromotion()) return play('promote')
  if (move.isKingsideCastle() || move.isQueensideCastle()) return play('castle')
  if (move.isCapture()) return play('capture')
  play('move')
}

export function isPromotionMove(fen: string, from: string, to: string) {
  const game = new Chess(fen)
  const piece = game.get(from as Square)
  if (!piece || piece.type !== 'p') return false
  if (!((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))) return false
  return game.moves({ square: from as Square, verbose: true }).some((m) => m.to === to)
}

export function kingSquareInCheck(fen: string): string | null {
  const game = new Chess(fen)
  if (!game.inCheck()) return null
  const turn = game.turn()
  for (const row of game.board()) for (const sq of row) if (sq && sq.type === 'k' && sq.color === turn) return sq.square
  return null
}

export type ResultKind = 'mate' | 'stalemate' | 'material' | 'repeat' | 'fifty' | 'draw'
export type ResultInfo = { over: boolean; text: string; winner: 'w' | 'b' | null; kind?: ResultKind }

export function gameResult(game: Chess): ResultInfo {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'b' : 'w'
    return { over: true, kind: 'mate', winner, text: `كش مات! ${winner === 'w' ? 'الأبيض' : 'الأسود'} كسب` }
  }
  if (game.isStalemate()) return { over: true, kind: 'stalemate', winner: null, text: 'تعادل: ملك محبوس (بات)' }
  if (game.isInsufficientMaterial()) return { over: true, kind: 'material', winner: null, text: 'تعادل: القطع اللي فاضلة ما تكفيش لمات' }
  if (game.isThreefoldRepetition()) return { over: true, kind: 'repeat', winner: null, text: 'تعادل: نفس الوضع اتكرر تلات مرات' }
  if (game.isDrawByFiftyMoves()) return { over: true, kind: 'fifty', winner: null, text: 'تعادل: قاعدة الخمسين نقلة' }
  if (game.isDraw()) return { over: true, kind: 'draw', winner: null, text: 'تعادل' }
  return { over: false, winner: null, text: '' }
}

/** Replay a list of SAN/UCI moves from a fen; returns fens after each ply (index 0 = start). */
export function replay(startFen: string, moves: string[]) {
  const game = new Chess(startFen)
  const fens = [game.fen()]
  const history: Move[] = []
  for (const m of moves) {
    const mv = game.move(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m) ? parseUci(m) : m)
    history.push(mv)
    fens.push(game.fen())
  }
  return { fens, history, game }
}

export function turnName(c: 'w' | 'b') {
  return c === 'w' ? 'الأبيض' : 'الأسود'
}

export function shuffle<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
