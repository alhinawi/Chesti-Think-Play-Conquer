import type { ReactNode } from 'react'

// Tiny formatter: blank line = new paragraph, **bold**, `move` (LTR chess notation), "- " lines = list.
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>)
    else
      out.push(
        <bdi key={`${keyBase}-${i++}`} dir="ltr" className="rounded bg-gold-soft px-1.5 py-0.5 font-sans text-[0.92em] font-bold text-gold">
          {tok.slice(1, -1)}
        </bdi>,
      )
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className={`prose-ar ${className}`}>
      {blocks.map((b, bi) => {
        const lines = b.split('\n')
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={bi} className="my-2 space-y-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                  <span>{inline(l.trim().slice(2), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return <p key={bi}>{inline(lines.join(' '), String(bi))}</p>
      })}
    </div>
  )
}
