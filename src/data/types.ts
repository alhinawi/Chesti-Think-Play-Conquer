export type ArrowColor = 'gold' | 'green' | 'red' | 'blue'
export type Arr = [string, string] | [string, string, ArrowColor]

export interface ExplainStep {
  kind: 'explain'
  text: string
  fen?: string
  arrows?: Arr[]
  highlights?: string[]
  orientation?: 'white' | 'black'
}

export interface TaskStep {
  kind: 'task'
  text: string
  fen: string
  /** UCI moves: the user's moves and the computer's replies in order. "a|b" = either is right. */
  solution: string[]
  /** extra ways to finish: any mate, or reaching one of `to` */
  goal?: 'mate' | 'to'
  to?: string[]
  hint?: string
  success?: string
  userColor?: 'w' | 'b'
  orientation?: 'white' | 'black'
  arrows?: Arr[]
  highlights?: string[]
}

export interface LineStep {
  kind: 'line'
  text: string
  fen?: string
  /** SAN moves */
  moves: string[]
  /** comment shown after the move with that index (0-based) */
  notes?: Record<number, string>
  orientation?: 'white' | 'black'
}

export type Step = ExplainStep | TaskStep | LineStep

export interface Lesson {
  id: string
  title: string
  summary: string
  steps: Step[]
}

export interface Chapter {
  id: string
  title: string
  desc: string
  glyph: string
  lessons: Lesson[]
}

export interface Trap {
  id: string
  name: string
  en: string
  opening: string
  /** the side that sets the trap */
  side: 'w' | 'b'
  level: 'سهل' | 'متوسط' | 'متقدم'
  summary: string
  /** SAN moves from the starting position */
  moves: string[]
  /** one comment per move ('' = no comment) */
  notes: string[]
  /** index of the losing mistake in `moves` */
  mistake: number
  avoid: string
}

export interface Puzzle {
  id: string
  name: string
  theme: string
  level: 'سهل' | 'متوسط' | 'متقدم'
  fen: string
  solution: string[]
  text: string
  explain: string
}

export type Block =
  | { h: string }
  | { p: string }
  | { list: string[] }
  | { board: { fen: string; caption: string; arrows?: Arr[]; orientation?: 'white' | 'black' } }
  | { line: { moves: string[]; caption: string; fen?: string } }

export type Category = 'rules' | 'openings' | 'tactics' | 'strategy' | 'endgames' | 'history' | 'players'

export interface Article {
  id: string
  title: string
  en?: string
  category: Category
  summary: string
  tags?: string[]
  blocks: Block[]
}

export interface Term {
  term: string
  en: string
  def: string
}
