'use client'

import Link from 'next/link'
import { Icon, PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export function PlayHub() {
  const { t } = useI18n()
  const modes = [
    { to: '/play/computer', icon: 'cpu', title: t('pc.modeComputerTitle'), desc: t('pc.modeComputerDesc') },
    { to: '/play/friend', icon: 'users', title: t('pc.modeFriendTitle'), desc: t('pc.modeFriendDesc') },
  ]
  return (
    <>
      <PageHeader kicker={t('pc.kicker')} title={t('pc.hubTitle')} desc={t('pc.hubDesc')} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {modes.map((m) => (
          <li key={m.to}>
            <Link href={m.to} className="luxe-card group flex h-full items-start gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-gold/50">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold">
                <Icon name={m.icon} className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-lg font-bold group-hover:text-gold">{m.title}</span>
                <span className="mt-1 block text-sm text-muted">{m.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function ComputerHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('pc.kicker')} title={t('pc.computerTitle')} />
}

export function FriendHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('pc.kicker')} title={t('pc.friendTitle')} />
}

export function World3DHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('wp.hKicker')} title={t('wp.hTitle')} desc={t('wp.hDesc')} />
}

export function World3DProHeader() {
  const { t } = useI18n()
  return <PageHeader kicker={t('wp.pKicker')} title={t('wp.pTitle')} desc={t('wp.pDesc')} />
}
