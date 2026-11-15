'use client'

import { signOut, useAuth } from '../lib/auth'
import AuthForm from './AuthForm'
import { Button } from './ui'

export default function Account() {
  const { status, user } = useAuth()

  if (status === 'loading') return null

  if (status === 'authed' && user) {
    return (
      <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-gold-2 to-gold text-2xl font-bold text-[#1a1408]" aria-hidden>
            {user.name.trim().charAt(0) || '؟'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="acc-h" className="font-display text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted"><bdi className="ltr">{user.email}</bdi></p>
            <p className="mt-1 text-xs text-emerald">حسابك متسجل — أدوارك ونتايجك بتحفظ لوحدها.</p>
          </div>
          <Button variant="ghost" onClick={() => void signOut()}>
            سجّل خروج
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
      <h2 id="acc-h" className="font-display text-xl font-bold">اعمل حساب</h2>
      <p className="mt-1 text-sm text-muted">بحساب تقدر تسجّل أدوارك وتدخل سباق المتصدرين من أي جهاز. مجاني طبعًا.</p>
      <AuthForm />
    </section>
  )
}
