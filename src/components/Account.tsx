'use client'

import { useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { refreshUser, signOut, useAuth } from '../lib/auth'
import { updateMe } from '../lib/api'
import { fileToAvatar } from '../lib/avatar'
import AuthForm from './AuthForm'
import { Button } from './ui'

export default function Account() {
  const params = useSearchParams()
  const mode = params.get('mode') === 'login' ? 'login' : 'register'
  const { status, user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (status === 'loading') return null

  if (status === 'authed' && user) {
    const pick = async (f: File | undefined) => {
      if (!f || busy) return
      setBusy(true)
      setErr('')
      try {
        await updateMe({ avatar: await fileToAvatar(f) })
        await refreshUser()
      } catch (e) {
        setErr(e instanceof Error && e.message && !e.message.startsWith('http') ? e.message : 'الصورة متلزمتش - جرّب صورة تانية')
      } finally {
        setBusy(false)
        if (fileRef.current) fileRef.current.value = ''
      }
    }
    const remove = async () => {
      if (busy) return
      setBusy(true)
      setErr('')
      try {
        await updateMe({ avatar: null })
        await refreshUser()
      } catch {
        setErr('مش قادرين نشيل الصورة دلوقتي - جرّب تاني')
      } finally {
        setBusy(false)
      }
    }
    return (
      <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
        <div className="flex flex-wrap items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-gold-2 to-gold text-2xl font-bold text-[#1a1408]" aria-hidden>
              {user.name.trim().charAt(0) || '؟'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="acc-h" className="font-display text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted"><bdi className="ltr block truncate">{user.email}</bdi></p>
            <p className="mt-1 text-xs text-emerald">حسابك متسجل — أدوارك ونتايجك بتحفظ لوحدها.</p>
            {err && <p className="mt-1 text-xs text-danger" role="alert">{err}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? 'بنرفع…' : user.avatar ? 'غيّر صورتك' : 'حط صورتك'}
            </Button>
            {user.avatar && (
              <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
                شيل الصورة
              </Button>
            )}
            <Button variant="ghost" onClick={() => void signOut()}>
              سجّل خروج
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
      </section>
    )
  }

  return (
    <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
      <h2 id="acc-h" className="font-display text-xl font-bold">{mode === 'login' ? 'ادخل لحسابك' : 'اعمل حساب'}</h2>
      <p className="mt-1 text-sm text-muted">بحساب تقدر تسجّل أدوارك وتدخل سباق المتصدرين من أي جهاز. مجاني طبعًا.</p>
      <AuthForm initialMode={mode} />
    </section>
  )
}
