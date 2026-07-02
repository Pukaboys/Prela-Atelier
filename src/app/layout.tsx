import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jost',
  display: 'swap',
})

function normalizeUrl(raw: string | undefined): string {
  const url = raw ?? 'http://localhost:3000'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}
const APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Prela Atelier — Luxury Marble Accessories',
    template: '%s | Prela Atelier',
  },
  description:
    'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
  keywords: ['marble', 'luxury', 'accessories', 'handcrafted', 'home decor', 'Albania', 'Prela Atelier'],
  authors: [{ name: 'Prela Atelier', url: APP_URL }],
  creator: 'Prela Atelier',
  openGraph: {
    type: 'website',
    siteName: 'Prela Atelier',
    title: 'Prela Atelier — Luxury Marble Accessories',
    description:
      'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
    locale: 'en_US',
    url: APP_URL,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@PrelaAtelier',
    title: 'Prela Atelier — Luxury Marble Accessories',
    description:
      'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: APP_URL,
  },
  icons: {
    icon: [
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon-256x256.png', sizes: '256x256', type: 'image/png' },
      { url: '/favicon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Prela Atelier',
  url: APP_URL,
  description:
    'Handcrafted marble accessories of timeless beauty, crafted in Laç, Albania.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Laç',
    addressCountry: 'AL',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@prelaatelier.com',
    contactType: 'customer service',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
      <GoogleAnalytics gaId="G-H5T5V52YN9" />
      <Analytics />
      <SpeedInsights />
    </html>
  )
}
