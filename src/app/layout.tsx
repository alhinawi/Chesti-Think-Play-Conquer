import TitleSync from '../components/TitleSync'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import Providers from '../components/Providers'
import Shell from '../components/Shell'
import { THEME_BOOT_SCRIPT } from '../lib/settings'
import { LANG_BOOT_SCRIPT } from '../lib/i18n/config'
import { SITE } from '../lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['شطرنج', 'تعلم الشطرنج', 'دروس شطرنج', 'فخاخ الشطرنج', 'ألغاز شطرنج', 'افتتاحات الشطرنج', 'chess', 'learn chess arabic'],
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: { type: 'website', locale: 'ar_EG', siteName: SITE.name, title: SITE.name, description: SITE.description, url: '/' },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
}

export const viewport: Viewport = {
  themeColor: '#0e0d0b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <TitleSync />
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
