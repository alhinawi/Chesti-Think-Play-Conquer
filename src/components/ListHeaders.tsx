'use client'

import { LinkButton, PageHeader } from './ui'
import { useI18n } from '../lib/i18n'

export function TrapsHeader() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader kicker={t('lb.trapsKicker')} title={t('lb.trapsTitle')} desc={t('lb.trapsDesc')} />
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <strong className="text-fg">{t('lb.trapsNoteStrong')}</strong> — {t('lb.trapsNote')}
      </div>
    </>
  )
}

export function MiniaturesHeader() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader kicker={t('lb.minKicker')} title={t('lb.minTitle')} desc={t('lb.minDesc')} />
      <div className="mb-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        <strong className="text-fg">{t('lb.minNoteStrong')}</strong> — {t('lb.minNote')}
      </div>
    </>
  )
}

export function OpeningsHeader() {
  const { t } = useI18n()
  return (
    <PageHeader kicker={t('lb.openKicker')} title={t('lb.openTitle')} desc={t('lb.openDesc')}>
      <LinkButton to="/openings/explorer" variant="soft">
        {t('lb.openExplorer')}
      </LinkButton>
    </PageHeader>
  )
}
