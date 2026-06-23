'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/cn'

const links = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/leads', label: 'Lead Scanner' },
  { href: '/dashboard/saved', label: 'Saved Leads' },
]

export function DashboardNav({ userName, isAdmin }: { userName?: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/demo')
  }

  function navLink(href: string, label: string, active: boolean) {
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AL</span>
          </div>
          <span className="text-white font-semibold text-sm">AgencyLead Radar</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="text-slate-300 hover:text-white" aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Overlay on mobile when the drawer is open */}
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar — slides in on mobile, always visible on md+ */}
      <aside
        className={cn(
          'w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 h-full z-50 transform transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AL</span>
            </div>
            <span className="text-white font-semibold text-sm">AgencyLead Radar</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => navLink(l.href, l.label, l.exact ? pathname === l.href : pathname.startsWith(l.href)))}
          {isAdmin && navLink('/admin', 'Admin', pathname.startsWith('/admin'))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-slate-500 text-xs mb-3 truncate">{userName}</p>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm w-full text-left transition-colors">
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
