import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardNav } from '@/components/DashboardNav'
import { ToastContainer } from '@/components/ui/Toast'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')
  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardNav userName={user.email} isAdmin={true} />
      <main className="ml-56 min-h-screen p-6">{children}</main>
      <ToastContainer />
    </div>
  )
}
