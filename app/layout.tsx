import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

const siteTitle = 'AgencyLead Radar — AI Lead Scoring for US Agencies'
const siteDescription = 'Find local businesses that need your web design or SEO services. Score leads, spot online weaknesses, generate personalized outreach in seconds.'

// Tolerate NEXT_PUBLIC_APP_URL being set without a scheme (e.g. "example.com")
// or being invalid — new URL() would otherwise throw at build time.
function resolveBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withProtocol)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export const metadata: Metadata = {
  metadataBase: resolveBaseUrl(),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: 'AgencyLead Radar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
