'use client'

import { FormEvent, useEffect, useState } from 'react'
import * as api from '../lib/api'
import { Button } from './ui'

type Mode = 'login' | 'register'

export default function Account() {
  const [user, setUser] = useState<api.ApiUser | null>(null)
  const [checked, setChecked] = useState(false)
  const [mode, setMode] = useState<Mode>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!api.getToken()) {
      setChecked(true)
      return
    }
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = mode === 'login' ? await api.login(email, password) : await api.register(name, email, password)
      setUser(u)
    } catch {
      setError(mode === 'login' ? 'الإيميل أو كلمة السر مش صح.' : 'معرفناش نعمل الحساب — جرّب كلمة سر أطول (٨ حروف على الأقل) أو ممكن الإيميل متسجل قبل كده.')
    } finally {
      setBusy(false)
    }
  }

  if (!checked) return null

  if (user) {
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
          <Button
            variant="ghost"
            onClick={() => {
              api.logout()
              setUser(null)
            }}
          >
            سجّل خروج
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
      <h2 id="acc-h" className="font-display text-xl font-bold">
        {mode === 'login' ? 'سجّل دخولك' : 'اعمل حساب'}
      </h2>
      <p className="mt-1 text-sm text-muted">
        بحساب تقدر تسجّل أدوارك وتدخل سباق المتصدرين من أي جهاز. مجاني طبعًا.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        {mode === 'register' && (
          <label className="flex flex-col gap-1 text-sm font-bold">
            الاسم (اللي هيظهر في المتصدرين)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={40}
              className="rounded-xl border border-line bg-bg px-3 py-2.5 font-normal outline-none focus:border-gold"
              placeholder="مثال: هناوي"
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-bold">
          الإيميل
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
            className="rounded-xl border border-line bg-bg px-3 py-2.5 font-normal outline-none focus:border-gold"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          كلمة السر
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            dir="ltr"
            className="rounded-xl border border-line bg-bg px-3 py-2.5 font-normal outline-none focus:border-gold"
            placeholder="٨ حروف على الأقل"
          />
        </label>
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? 'ثانية…' : mode === 'login' ? 'ادخل' : 'سجّل'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="text-sm font-bold text-gold hover:underline"
          >
            {mode === 'login' ? 'معندكش حساب؟ اعمل واحد' : 'عندك حساب؟ ادخل'}
          </button>
        </div>
      </form>
    </section>
  )
}
