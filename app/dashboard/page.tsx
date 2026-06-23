import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

function statusBadgeVariant(status: string) {
  if (status === 'saved') return 'info'
  if (status === 'contacted') return 'warning'
  if (status === 'interested') return 'success'
  if (status === 'not_suitable') return 'danger'
  return 'default'
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/demo')

  const [totalLeads, savedLeads, audits, leads] = await Promise.all([
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.lead.count({ where: { userId: user.id, status: 'saved' } }),
    prisma.aiAudit.count({ where: { userId: user.id } }),
    prisma.lead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { aiAudits: { take: 1, orderBy: { createdAt: 'desc' } } },
    }),
  ])

  const highOpportunity = leads.filter(l => l.opportunityScore >= 80).length
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((sum, l) => sum + l.opportunityScore, 0) / leads.length)
    : 0

  const recentLeads = leads.slice(0, 5)
  const topLeads = [...leads].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">Welcome back, {user.fullName || user.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: totalLeads, color: 'text-white' },
          { label: 'Saved Leads', value: savedLeads, color: 'text-blue-400' },
          { label: 'High Opportunity', value: highOpportunity, color: 'text-green-400' },
          { label: 'AI Audits', value: audits, color: 'text-purple-400' },
          { label: 'Avg Score', value: avgScore, color: avgScore >= 60 ? 'text-green-400' : 'text-amber-400' },
        ].map(s => (
          <Card key={s.label} className="py-4">
            <p className="text-slate-500 text-xs mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/leads?add=1"><Button>+ Add Lead</Button></Link>
          <Link href="/dashboard/leads"><Button variant="secondary">View Lead Scanner</Button></Link>
          <Link href="/dashboard/saved"><Button variant="secondary">Saved Leads</Button></Link>
          <a href="/api/leads/export"><Button variant="ghost">Export CSV</Button></a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No leads yet. <Link href="/dashboard/leads?add=1" className="text-blue-400">Add your first lead →</Link></p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors group">
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">{lead.businessName}</p>
                    <p className="text-slate-500 text-xs">{lead.niche} · {lead.city}, {lead.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(lead.status)}>{lead.status.replace('_', ' ')}</Badge>
                    <ScoreBadge score={lead.opportunityScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Top Opportunities</h2>
            <Link href="/dashboard/leads?minScore=80" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
          </div>
          {topLeads.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {topLeads.map(lead => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors group">
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">{lead.businessName}</p>
                    <p className="text-slate-500 text-xs">{lead.recommendedService || lead.niche}</p>
                  </div>
                  <ScoreBadge score={lead.opportunityScore} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
