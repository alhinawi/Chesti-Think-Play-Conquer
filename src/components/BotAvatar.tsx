import type { Bot } from '../data/bots'

/** Round bot avatar: the player's photo when available, otherwise the initials tile. */
export function BotAvatar({ bot, className = 'h-9 w-9 text-xs' }: { bot: Bot; className?: string }) {
  if (bot.photo)
    return (
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-gold-2 to-gold ${className}`} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bot.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
      </span>
    )
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold font-bold text-[#1a1408] ${className}`} aria-hidden>
      {bot.initials}
    </span>
  )
}
