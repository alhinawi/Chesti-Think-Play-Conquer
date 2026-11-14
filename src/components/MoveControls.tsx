'use client'

import { Button, Icon } from './ui'

/**
 * Start / previous / play / next / end, always laid out left to right like a media player,
 * so the RTL page can never flip it: each icon points the way its button moves.
 */
export default function MoveControls({
  ply,
  total,
  go,
  auto,
  onToggle,
  playLabel,
  className = '',
}: {
  ply: number
  total: number
  go: (ply: number) => void
  auto: boolean
  onToggle: () => void
  /** text beside the play icon; icon only when left out */
  playLabel?: string
  className?: string
}) {
  const atStart = ply <= 0
  const atEnd = ply >= total
  return (
    <div dir="ltr" role="group" aria-label="التحكم في النقلات" className={`mx-auto grid w-full max-w-sm grid-cols-[1fr_1fr_1.7fr_1fr_1fr] gap-1.5 ${className}`}>
      <Button variant="soft" aria-label="أول الدور" onClick={() => go(0)} disabled={atStart} className="min-w-0 px-0!">
        <Icon name="first" />
      </Button>
      <Button variant="soft" aria-label="النقلة اللي فاتت" onClick={() => go(ply - 1)} disabled={atStart} className="min-w-0 px-0!">
        <Icon name="prev" />
      </Button>
      <Button aria-label={auto ? 'وقّف العرض' : 'شغّل العرض'} onClick={onToggle} className="min-w-0 px-1!">
        <Icon name={auto ? 'pause' : 'play'} />
        {playLabel && <span dir="rtl">{playLabel}</span>}
      </Button>
      <Button variant="soft" aria-label="النقلة اللي بعدها" onClick={() => go(ply + 1)} disabled={atEnd} className="min-w-0 px-0!">
        <Icon name="next" />
      </Button>
      <Button variant="soft" aria-label="آخر الدور" onClick={() => go(total)} disabled={atEnd} className="min-w-0 px-0!">
        <Icon name="last" />
      </Button>
    </div>
  )
}
