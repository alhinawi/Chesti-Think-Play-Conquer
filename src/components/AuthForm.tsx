'use client'

import { FormEvent, useEffect, useState } from 'react'
import { signIn, signUp } from '../lib/auth'
import { getAuthConfig, googleLoginUrl } from '../lib/api'
import { Button } from './ui'

type Mode = 'login' | 'register'

export default function AuthForm({ onDone, initialMode = 'register' }: { onDone?: () => void; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Google sign-in appears only when the backend reports it is configured
  // (OAuth secrets set on the worker). Default hidden.
  const [googleEnabled, setGoogleEnabled] = useState(false)
  useEffect(() => {
    getAuthConfig().then((cfg) => setGoogleEnabled(cfg.google))
  }, [])

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
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => {
              window.location.href = googleLoginUrl()
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 font-bold text-gray-800 shadow transition hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.1 44 30 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            <span>المتابعة بحساب Google</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line"></div>
            <span className="text-xs font-bold text-muted">أو بالإيميل</span>
            <div className="h-px flex-1 bg-line"></div>
          </div>
        </>
      )}
      {mode === 'register' && (
        <label className="flex flex-col gap-1 text-sm font-bold">
          الاسم
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
