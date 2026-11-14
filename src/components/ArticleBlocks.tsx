import ChessBoard from './ChessBoard'
import RichText from './RichText'
import { LineViewer } from './StepPlayer'
import type { Arr, Block } from '../data/types'

const toArrows = (a?: Arr[]) => (a ?? []).map(([from, to, color]) => ({ from, to, color }))

/** Renders encyclopedia article blocks. Text is server-rendered so search engines read it. */
export default function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-[1.05rem]">
      {blocks.map((b, i) => {
        if ('h' in b)
          return (
            <h2 key={i} className="pt-3 text-xl font-bold text-gold">
              {b.h}
            </h2>
          )
        if ('p' in b) return <RichText key={i} text={b.p} />
        if ('list' in b) return <RichText key={i} text={b.list.map((x) => `- ${x}`).join('\n')} />
        if ('board' in b)
          return (
            <figure key={i} className="mx-auto w-full max-w-[420px]">
              <ChessBoard fen={b.board.fen} movable={false} arrows={toArrows(b.board.arrows)} orientation={b.board.orientation} />
              <figcaption className="mt-2 text-center text-sm text-muted">{b.board.caption}</figcaption>
            </figure>
          )
        return (
          <figure key={i} className="luxe-card rounded-2xl p-3 sm:p-5">
            <figcaption className="mb-3 text-sm font-bold text-muted">{b.line.caption}</figcaption>
            <LineViewer step={{ kind: 'line', text: b.line.caption, moves: b.line.moves, fen: b.line.fen }} compact />
          </figure>
        )
      })}
    </div>
  )
}
