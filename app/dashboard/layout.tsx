import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { DashboardNav } from '@/components/DashboardNav'
import { ToastContainer } from '@/components/ui/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/demo')

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardNav userName={user.email} isAdmin={user.role === 'admin'} />
      <main className="ml-56 min-h-screen p-6">
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}
