import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgencyLead Radar — AI Lead Scoring for US Agencies',
  description: 'Find local businesses that need your web design or SEO services. Score leads, spot online weaknesses, generate personalized outreach in seconds.',
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
