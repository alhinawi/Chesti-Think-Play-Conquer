'use client'

import { useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { refreshUser, signOut, useAuth } from '../lib/auth'
import { updateMe } from '../lib/api'
import { fileToAvatar } from '../lib/avatar'
import AuthForm from './AuthForm'
import { useI18n } from '../lib/i18n'
import { Button } from './ui'

export default function Account() {
  const params = useSearchParams()
  const mode = params.get('mode') === 'login' ? 'login' : 'register'
  const { status, user } = useAuth()
  const { t } = useI18n()
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
        setErr(e instanceof Error && e.message && !e.message.startsWith('http') ? e.message : t('me.errAvatar'))
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
        setErr(t('me.errAvatarRemove'))
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
            <p className="mt-1 text-xs text-emerald">{t('me.verified')}</p>
            {err && <p className="mt-1 text-xs text-danger" role="alert">{err}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? t('me.uploading') : user.avatar ? t('me.changeAvatar') : t('me.addAvatar')}
            </Button>
            {user.avatar && (
              <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
                {t('me.removeAvatar')}
              </Button>
            )}
            <Button variant="ghost" onClick={() => void signOut()}>
              {t('me.logout')}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
      </section>
    )
  }

  return (
    <section className="luxe-card rounded-2xl border border-gold/30 p-5" aria-labelledby="acc-h">
      <h2 id="acc-h" className="font-display text-xl font-bold">{mode === 'login' ? t('me.authTitleLogin') : t('me.authTitleRegister')}</h2>
      <p className="mt-1 text-sm text-muted">{t('me.authSub')}</p>
      <AuthForm initialMode={mode} />
    </section>
  )
}
