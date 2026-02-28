import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { ToastProvider } from '@/components/providers/toast-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ServiceWorkerProvider } from '@/components/providers/sw-provider'

const inter = Inter({ subsets: ['latin'] })

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://owtra.xyz'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: 'Owtra – Job Application Tracker',
    template: '%s | Owtra',
  },

  description:
    'Smart job application tracking with AI-powered company matching. Track, analyze and land better roles.',

  applicationName: 'Owtra',

  keywords: [
    'job tracker',
    'job application tracker',
    'career tracking',
    'AI job matching',
    'productivity tool',
  ],

  authors: [{ name: 'Owtra Team' }],
  creator: 'Owtra',
  publisher: 'Owtra',

  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32' },
      { url: '/icons/icon-16x16.png', sizes: '16x16' },
    ],
    apple: [{ url: '/icons/icon-180x180.png', sizes: '180x180' }],
  },

  manifest: '/manifest.json',

  openGraph: {
    title: 'Owtra – Smarter Tracking. Sharper Insights.',
    description:
      'AI-powered job application tracking built to help you land the perfect role.',
    url: baseUrl,
    siteName: 'Owtra',
    images: [
      {
        url: `${baseUrl}/og/og-image-v2.png?v=2`,
        width: 1200,
        height: 630,
        alt: 'Owtra Job Application Tracker',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Owtra – Smarter Tracking. Sharper Insights.',
    description:
      'Track applications. Analyze performance. Get AI-powered company matching.',
    images: [`${baseUrl}/og/og-image-v2.png?v=2`],
  },
}

export const viewport: Viewport = {
  themeColor: '#1e40af',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ServiceWorkerProvider />
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}