'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from './ui/Button'

export function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
            <span className="text-white font-semibold text-lg">AgencyLead Radar</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link>
            <Link href="/waitlist" className="text-slate-400 hover:text-white text-sm transition-colors">Join Waitlist</Link>
            <Link href="/demo"><Button size="sm">Try Demo</Button></Link>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <Link href="/#how-it-works" className="text-slate-400 hover:text-white text-sm py-2">How It Works</Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white text-sm py-2">Pricing</Link>
            <Link href="/waitlist" className="text-slate-400 hover:text-white text-sm py-2">Join Waitlist</Link>
            <Link href="/demo"><Button size="sm" className="w-full">Try Demo</Button></Link>
          </div>
        )}
      </div>
    </nav>
  )
}
