'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

const links = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/leads', label: 'Lead Scanner' },
  { href: '/dashboard/saved', label: 'Saved Leads' },
]

export function DashboardNav({ userName, isAdmin }: { userName?: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/demo')
  }

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col h-full fixed left-0 top-0 z-30">
      <div className="p-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AL</span>
          </div>
          <span className="text-white font-semibold text-sm">AgencyLead Radar</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(l => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href)
          return (
            <Link key={l.href} href={l.href} className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}>
              {l.label}
            </Link>
          )
        })}
        {isAdmin && (
          <Link href="/admin" className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname.startsWith('/admin') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          )}>
            Admin
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <p className="text-slate-500 text-xs mb-3 truncate">{userName}</p>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm w-full text-left transition-colors">
          Log Out
        </button>
      </div>
    </aside>
  )
}
