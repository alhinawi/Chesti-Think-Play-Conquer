// A static, server-renderable board picture (no interaction). Used in lists and thumbnails.
const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }

export function MiniBoard({ fen, flip = false, label }: { fen: string; flip?: boolean; label?: string }) {
  const rows = fen.split(' ')[0].split('/')
  const cells: { piece: string | null; dark: boolean }[] = []
  rows.forEach((row, r) => {
    let c = 0
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let k = 0; k < +ch; k++, c++) cells.push({ piece: null, dark: (r + c) % 2 === 1 })
      } else {
        cells.push({ piece: ch, dark: (r + c) % 2 === 1 })
        c++
      }
    }
  })
  const ordered = flip ? [...cells].reverse() : cells
  return (
    <div dir="ltr" role="img" aria-label={label ?? 'رقعة شطرنج'} className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-md">
      {ordered.map((cell, i) => (
        <span
          key={i}
          className="grid place-items-center leading-none"
          style={{ background: cell.dark ? 'var(--sq-dark)' : 'var(--sq-light)', fontSize: 'min(3.4vw, 1.35rem)' }}
        >
          {cell.piece && (
            <span
              style={{
                color: cell.piece === cell.piece.toUpperCase() ? '#fbf7ec' : '#1b1712',
                textShadow: cell.piece === cell.piece.toUpperCase() ? '0 0 1px #000, 0 1px 1px #000' : '0 0 1px #fff8',
              }}
            >
              {GLYPH[cell.piece.toLowerCase()]}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
