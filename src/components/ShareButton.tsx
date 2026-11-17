'use client'

import { useState } from 'react'
import { Button, Icon } from './ui'
import { SITE } from '../lib/site'
import { useI18n } from '../lib/i18n'

/** Native share sheet on phones, copy to clipboard elsewhere. */
export default function ShareButton({ text, path, label }: { text: string; path: string; label?: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title: SITE.name, text, url })
        return
      }
    } catch {
      return // the user closed the sheet
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(t('lx.copyPrompt'), `${text}\n${url}`)
    }
  }
  return (
    <Button variant="soft" onClick={share}>
      <Icon name={copied ? 'check' : 'share'} /> {copied ? t('lx.copied') : label ?? t('lx.shareLabel')}
    </Button>
  )
}
