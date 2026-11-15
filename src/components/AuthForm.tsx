'use client'

import { FormEvent, useState } from 'react'
import { signIn, signUp } from '../lib/auth'
import { Button } from './ui'

type Mode = 'login' | 'register'

export default function AuthForm({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<Mode>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(name, email, password)
      onDone?.()
    } catch {
      setError(
        mode === 'login'
          ? 'الإيميل أو كلمة السر مش صح.'
          : 'معرفناش نعمل الحساب — جرّب كلمة سر أطول (٨ حروف على الأقل) أو ممكن الإيميل متسجل قبل كده.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
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
            autoComplete="name"
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
          autoComplete="email"
          inputMode="email"
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
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
  )
}
