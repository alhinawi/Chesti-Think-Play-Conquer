'use client'

import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import AuthForm from './AuthForm'
import { SITE } from '../lib/site'

/**
 * Registration is mandatory: without an account the site shows only this gate.
 * Local progress migrates into the account automatically on first sign-in.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="بنحمّل حسابك">
        <span className="grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-gradient-to-b from-gold-2 to-gold text-3xl text-[#1a1408]">♞</span>
      </div>
    )
  }

  if (status === 'anon') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-8">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-b from-gold-2 to-gold text-3xl text-[#1a1408]" aria-hidden>
            ♞
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-[1.4] sm:text-3xl">سجّل عشان تبدأ مشوارك</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            حسابك على {SITE.name} بيحفظ تقدمك ونقاطك من أي جهاز، وبيخلّيك تنافس في لوحة المتصدرين. مجاني طبعًا.
          </p>
        </div>
        <section className="luxe-card mt-6 rounded-2xl border border-gold/30 p-5" aria-label="التسجيل">
          <AuthForm />
        </section>
        <p className="mt-4 text-center text-xs text-muted">تقدمك المحلي هيتحوّل لحسابك أول ما تسجّل — مش هيضيع.</p>
      </div>
    )
  }

  return <>{children}</>
}
