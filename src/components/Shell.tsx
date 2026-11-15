'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Celebrate from './Celebrate'
import RankChip from './RankChip'
import { useEffect, useState, type ReactNode } from 'react'
import { NAV, SITE } from '../lib/site'
import { useSettings } from '../lib/settings'
import { useI18n } from '../lib/i18n'
import LangSwitcher from './LangSwitcher'
import { Icon } from './ui'

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
}

const NAV_KEYS: Record<string, string> = {
  '/': 'home',
  '/learn': 'learn',
  '/puzzles': 'puzzles',
  '/traps': 'traps',
  '/matches': 'matches',
  '/openings': 'openings',
  '/encyclopedia': 'encyclopedia',
  '/world3d': 'world3d',
  '/play': 'play',
}

/** sidebar groups: home alone, then learning sections, then play sections */
const GROUPS: { key: 'groupLearn' | 'groupPlay' | null; items: string[] }[] = [
  { key: null, items: ['/'] },
  { key: 'groupLearn', items: ['/learn', '/puzzles', '/traps', '/openings', '/encyclopedia'] },
  { key: 'groupPlay', items: ['/play', '/matches', '/world3d'] },
]

function NavList({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t('aria.sections')} className="flex flex-col gap-4">
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          {g.key && <p className="mb-1 px-3 text-xs font-bold tracking-wide text-muted">{t(`nav.${g.key}`)}</p>}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((href) => {
              const n = NAV.find((x) => x.href === href)!
              const on = isActive(path, n.href)
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onNavigate}
                    aria-current={on ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      on ? 'bg-gold-soft text-gold' : 'text-muted hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <Icon name={n.icon} className="h-5 w-5 shrink-0" />
                    {t(`nav.${NAV_KEYS[n.href]}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function Controls() {
  const { settings, update } = useSettings()
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        aria-label={settings.theme === 'dark' ? t('aria.themeToLight') : t('aria.themeToDark')}
      >
        <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <LangSwitcher />
      <Link
        href="/settings"
        aria-label={t('aria.settings')}
        className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="settings" />
      </Link>
    </div>
  )
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label={SITE.name}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-b from-gold-2 to-gold text-xl text-[#1a1408]">♞</span>
      <span className="font-display text-2xl font-bold text-gold-grad">{SITE.name}</span>
    </Link>
  )
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() || '/'
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  // close the drawer on navigation and on Escape
  useEffect(() => setOpen(false), [path])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="flex min-h-dvh flex-col">
      <Celebrate />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-black">
        {t('skip')}
      </a>

      {/* desktop sidebar (inline-start: right in Arabic, left in English) */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col gap-6 overflow-y-auto border-e border-line bg-bg/95 px-4 py-5 backdrop-blur md:flex">
        <Logo />
        <div className="flex-1">
          <NavList path={path} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <RankChip />
          <Controls />
        </div>
      </aside>

      {/* mobile top bar: menu + logo + rank only */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur md:hidden">
        <div className="flex h-14 items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('aria.menu')}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="menu" />
          </button>
          <Logo />
          <div className="ms-auto">
            <RankChip />
          </div>
        </div>
      </header>

      {/* mobile drawer */}
      {open && (
        <button
          type="button"
          aria-label={t('aria.closeMenu')}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/60 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col gap-5 overflow-y-auto border-e border-line bg-bg px-4 py-5 transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
        aria-label={t('aria.sections')}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('aria.closeMenu')}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1">
          <NavList path={path} onNavigate={() => setOpen(false)} />
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <Controls />
        </div>
      </aside>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 md:ps-72 md:pe-8">
        {children}
      </main>

      <footer className="hidden border-t border-line py-8 text-sm text-muted md:block md:ps-72 md:pe-8">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4">
          <p>
            <span className="font-display font-bold text-gold">{SITE.name}</span> — {t('footer.tagline')}
          </p>
          <nav aria-label={t('aria.footerNav')} className="flex flex-wrap gap-4">
            <Link href="/daily" className="hover:text-ink">{t('footer.daily')}</Link>
            <Link href="/me" className="hover:text-ink">{t('footer.me')}</Link>
            <Link href="/glossary" className="hover:text-ink">{t('footer.glossary')}</Link>
            <Link href="/settings" className="hover:text-ink">{t('footer.settings')}</Link>
            <span>{t('footer.engine')}</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
