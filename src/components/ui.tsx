import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

type Variant = 'gold' | 'ghost' | 'outline' | 'soft'

const VARIANTS: Record<Variant, string> = {
  gold: 'bg-gradient-to-b from-gold-2 to-gold text-[#1a1408] shadow-[0_8px_24px_-10px_var(--gold)] hover:brightness-110',
  outline: 'border border-gold/50 text-gold hover:bg-gold-soft',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  soft: 'bg-surface-2 text-ink hover:bg-gold-soft border border-line',
}

export function Button({
  variant = 'gold',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'gold', className = '', children }: { to: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link
      href={to}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.97] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`luxe-card rounded-2xl ${className}`}>{children}</div>
}

export function Badge({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'emerald' | 'muted' | 'danger' }) {
  const tones = {
    gold: 'bg-gold-soft text-gold border-gold/30',
    emerald: 'bg-emerald/10 text-emerald border-emerald/30',
    muted: 'bg-surface-2 text-muted border-line',
    danger: 'bg-danger/10 text-danger border-danger/30',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>
}

export function PageHeader({ kicker, title, desc, children }: { kicker?: string; title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <header className="animate-fade-up mb-8">
      {kicker && <p className="mb-2 text-sm font-bold tracking-wide text-gold">{kicker}</p>}
      <h1 className="font-display text-3xl leading-[1.4] font-bold sm:text-4xl">{title}</h1>
      {desc && <p className="mt-3 max-w-2xl text-muted">{desc}</p>}
      {children}
    </header>
  )
}

/** Small icon set (stroke icons, 24px grid). */
export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const p = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const paths: Record<string, ReactNode> = {
    home: <path {...p} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    learn: <path {...p} d="M2 8l10-5 10 5-10 5zM6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 8v6" />,
    trap: <path {...p} d="M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.8 6.5 19.5l1-6.3L3 8.9 9 8z" />,
    book: <path {...p} d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />,
    play: <path {...p} d="M7 4v16l13-8z" />,
    cpu: (
      <g {...p}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
      </g>
    ),
    users: <path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
    globe: <path {...p} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />,
    settings: (
      <g {...p}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </g>
    ),
    sun: <path {...p} d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />,
    moon: <path {...p} d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />,
    search: <path {...p} d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3" />,
    first: <path {...p} d="M6 5v14M18 6l-8 6 8 6z" />,
    prev: <path {...p} d="M15 6l-6 6 6 6" />,
    next: <path {...p} d="M9 6l6 6-6 6" />,
    last: <path {...p} d="M18 5v14M6 6l8 6-8 6z" />,
    expand: <path {...p} d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
    shrink: <path {...p} d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />,
    flip: <path {...p} d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />,
    undo: <path {...p} d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
    reset: <path {...p} d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
    bulb: <path {...p} d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />,
    flag: <path {...p} d="M4 22V4M4 4h13l-2 4 2 4H4" />,
    flame: <path {...p} d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" />,
    check: <path {...p} d="M20 6L9 17l-5-5" />,
    shield: <path {...p} d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" />,
    sound: (
      <g {...p}>
        <path d="M11 5L6 9H2v6h4l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.5 9.5 0 0 1 0 13" />
      </g>
    ),
    x: <path {...p} d="M18 6L6 18M6 6l12 12" />,
    menu: <path {...p} d="M3 6h18M3 12h18M3 18h18" />,
    copy: (
      <g {...p}>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </g>
    ),
    share: <path {...p} d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
    pause: <path {...p} d="M8 5v14M16 5v14" />,
    eye: <path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />,
    clock: <path {...p} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2" />,
    handshake: <path {...p} d="M11 17l2 2a1 1 0 0 0 3-3M14 14l2.5 2.5a1 1 0 0 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 0 1-3-3L10.3 4.6a5 5 0 0 1 6 .8L21 10M3 7l3.5 3.5M2 13l6 6" />,
    compass: (
      <g {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8l-2.5 5.5L8 16l2.5-5.5z" />
      </g>
    ),
    star: <path {...p} d="M12 2l3 6.5 7 .9-5 4.8 1.2 7-6.2-3.4L5.8 21 7 14.2 2 9.4l7-.9z" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  )
}
