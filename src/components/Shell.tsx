'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Celebrate from './Celebrate'
import RankChip from './RankChip'
import type { ReactNode } from 'react'
import { NAV, SITE } from '../lib/site'
import { useSettings } from '../lib/settings'
import { Icon } from './ui'

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() || '/'
  const { settings, update } = useSettings()
  return (
    <div className="flex min-h-dvh flex-col">
      <Celebrate />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-black">
        انتقل للمحتوى
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2" aria-label={SITE.name}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-gold-2 to-gold text-xl text-[#1a1408]">♞</span>
            <span className="font-display text-2xl font-bold text-gold-grad">{SITE.name}</span>
          </Link>
          <nav aria-label="الأقسام" className="ms-4 hidden flex-1 items-center gap-1 md:flex">
            {NAV.slice(1).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(path, n.href) ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(path, n.href) ? 'bg-gold-soft text-gold' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <RankChip />
            <button
              type="button"
              onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={settings.theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الغامق'}
            >
              <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link
              href="/settings"
              aria-label="الإعدادات"
              aria-current={path === '/settings' ? 'page' : undefined}
              className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Icon name="settings" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:pb-12">
        {children}
      </main>

      <footer className="hidden border-t border-line py-8 text-sm text-muted md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
          <p>
            <span className="font-display font-bold text-gold">{SITE.name}</span> — {SITE.tagline}
          </p>
          <nav aria-label="روابط الفوتر" className="flex flex-wrap gap-4">
            <Link href="/daily" className="hover:text-ink">لغز اليوم</Link>
            <Link href="/me" className="hover:text-ink">ملفي</Link>
            <Link href="/glossary" className="hover:text-ink">قاموس المصطلحات</Link>
            <Link href="/settings" className="hover:text-ink">الإعدادات</Link>
            <span>المحرك: Stockfish 19</span>
          </nav>
        </div>
      </footer>

      <nav
        aria-label="الأقسام"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-9">
          {NAV.map((n) => {
            const on = isActive(path, n.href)
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={on ? 'page' : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${on ? 'text-gold' : 'text-muted'}`}
                >
                  <Icon name={n.icon} className="h-5 w-5" />
                  {n.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
