'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { Button } from './ui'

const DISMISS_KEY = 'chesti-auth-nudge-dismissed'

/** Friendly, dismissible sign-up prompt. Never blocks the content. */
export default function AuthNudge() {
  const { status } = useAuth()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (status !== 'anon' || dismissed) return null

  return (
    <div className="luxe-card mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-gold-2 to-gold text-lg text-[#1a1408]" aria-hidden>
        ♞
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <b>عايز تقدمك يتحفظ من أي جهاز وتنافس في لوحة المتصدرين؟</b>{' '}
        <span className="text-muted">اعمل حساب مجاني - تقدمك المحلي هيتحوّل لوحده.</span>
      </p>
      <div className="flex items-center gap-2">
        <Link href="/me">
          <Button>اعمل حساب</Button>
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, '1')
            } catch {
              /* fine */
            }
            setDismissed(true)
          }}
          className="rounded-lg px-3 py-2 text-sm font-bold text-muted hover:text-ink"
        >
          لاحقًا
        </button>
      </div>
    </div>
  )
}
