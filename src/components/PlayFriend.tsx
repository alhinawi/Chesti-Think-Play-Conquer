'use client'

import { useEffect, useState } from 'react'
import LocalGame from './LocalGame'
import OnlineGame from './OnlineGame'
import { Icon } from './ui'
import { normalizeRoomCode } from '../lib/online'

export default function PlayFriend() {
  const [tab, setTab] = useState<'local' | 'online'>('local')
  const [room, setRoom] = useState<string | null>(null)

  useEffect(() => {
    const code = normalizeRoomCode(new URLSearchParams(window.location.search).get('room'))
    if (code) {
      setRoom(code)
      setTab('online')
    }
  }, [])

  const tabs = [
    { id: 'local', label: 'على نفس الجهاز', icon: 'users' },
    { id: 'online', label: 'أونلاين بلينك', icon: 'globe' },
  ] as const

  return (
    <div>
      <div role="tablist" aria-label="طريقة اللعب" className="mb-5 inline-flex rounded-2xl border border-line bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === t.id ? 'bg-gradient-to-b from-gold-2 to-gold text-[#1a1408]' : 'text-muted hover:text-ink'}`}
          >
            <Icon name={t.icon} className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tab === 'local' ? <LocalGame /> : <OnlineGame initialRoom={room} onLeave={() => setRoom(null)} />}</div>
    </div>
  )
}
