'use client'

import Link from 'next/link'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'

/**
 * Visitor login/sign-up buttons, or an account chip when signed in.
 * variant="header": compact row for the mobile top bar.
 * variant="block": full-width pair for the drawer / desktop sidebar.
 */
export default function AuthButtons({ variant = 'block' }: { variant?: 'header' | 'block' }) {
  const { status, user } = useAuth()
  const { t } = useI18n()

  if (status === 'loading') return variant === 'block' ? <div className="h-[42px]" aria-hidden /> : null

  if (status === 'authed' && user) {
    const initial = user.name.trim().charAt(0) || '؟'
    if (variant === 'header') {
      return (
        <Link
          href="/me"
          aria-label={user.name}
          title={user.name}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-sm font-bold text-[#1a1408]"
        >
          {initial}
        </Link>
      )
    }
    return (
      <Link
        href="/me"
        className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 transition hover:border-gold/50"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-base font-bold text-[#1a1408]" aria-hidden>
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{user.name}</span>
      </Link>
    )
  }

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
