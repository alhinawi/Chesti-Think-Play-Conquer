'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut, useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { Icon } from './ui'

function AvatarImg({ user, size }: { user: { name: string; avatar?: string | null }; size: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-base'
  if (user.avatar) return <img src={user.avatar} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />
  return (
    <span
      aria-hidden
      className={`grid ${cls} shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold font-bold text-[#1a1408]`}
    >
      {user.name.trim().charAt(0) || '?'}
    </span>
  )
}

/** Avatar dropdown: name + email, link to the account page, sign out. */
function AvatarMenu({ user, variant }: { user: { name: string; email: string; avatar?: string | null; admin?: boolean }; variant: 'header' | 'block' }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const path = usePathname()

  // close on navigation
  useEffect(() => setOpen(false), [path])
  // close on outside click / tap and on Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={user.name}
          title={user.name}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <AvatarImg user={user} size="sm" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-start transition hover:border-gold/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <AvatarImg user={user} size="md" />
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{user.name}</span>
          <Icon name={open ? 'x' : 'menu'} className="h-4 w-4 shrink-0 text-muted" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          aria-label={user.name}
          className={`luxe-card animate-fade-up absolute z-50 mt-2 overflow-hidden rounded-2xl py-1.5 ${variant === 'block' ? 'start-0 w-full' : 'end-0 w-64'}`}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <AvatarImg user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-muted" dir="ltr" style={{ textAlign: 'end' }}>{user.email}</p>
            </div>
          </div>
          <Link
            href="/me"
            role="menuitem"
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm font-bold transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
          >
            <Icon name="user" className="h-4.5 w-4.5 shrink-0 text-gold" />
            {t('ab.myAccount')}
          </Link>
          {user.admin && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm font-bold transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              <Icon name="shield" className="h-4.5 w-4.5 shrink-0 text-gold" />
              {t('ab.dashboard')}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10 focus-visible:bg-danger/10 focus-visible:outline-none"
          >
            <Icon name="logout" className="h-4.5 w-4.5 shrink-0" />
            {t('ab.logout')}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Visitor login/sign-up buttons, or an account chip when signed in.
 * variant="header": compact row for the mobile top bar.
 * variant="block": full-width pair for the drawer / desktop sidebar.
 */
export default function AuthButtons({ variant = 'block' }: { variant?: 'header' | 'block' }) {
  const { status, user } = useAuth()
  const { t } = useI18n()

  if (status === 'loading') return variant === 'block' ? <div className="h-[42px]" aria-hidden /> : null

  if (status === 'authed' && user) return <AvatarMenu user={user} variant={variant} />

  if (variant === 'header') {
    return (
      <Link
        href="/me"
        className="shrink-0 rounded-lg bg-gradient-to-b from-gold-2 to-gold px-2.5 py-1.5 text-xs font-bold text-[#1a1408] transition hover:brightness-110"
      >
        {t('auth.register')}
      </Link>
    )
  }

  return (
    <Link
      href="/me"
      className="block rounded-xl bg-gradient-to-b from-gold-2 to-gold px-3 py-2.5 text-center text-sm font-bold text-[#1a1408] transition hover:brightness-110"
    >
      {t('auth.register')}
    </Link>
  )
}
