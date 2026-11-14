'use client'

import { useState } from 'react'
import { Button, Icon } from './ui'

/** Native share sheet on phones, copy to clipboard elsewhere. */
export default function ShareButton({ text, path, label = 'شَيّر النتيجة' }: { text: string; path: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'شطرنجي', text, url })
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
      window.prompt('انسخ:', `${text}\n${url}`)
    }
  }
  return (
    <Button variant="soft" onClick={share}>
      <Icon name={copied ? 'check' : 'share'} /> {copied ? 'اتنسخ' : label}
    </Button>
  )
}
