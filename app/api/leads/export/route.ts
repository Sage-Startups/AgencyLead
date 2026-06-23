import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { leadsToCSV } from '@/lib/export'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leads = await prisma.lead.findMany({
    where: { userId: session.userId },
    include: { aiAudits: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { opportunityScore: 'desc' },
  })

  const csv = leadsToCSV(leads as Record<string, unknown>[])
  await prisma.activityLog.create({
    data: { userId: session.userId, actionType: 'lead_exported', description: `Exported ${leads.length} leads` }
  })
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="agencylead-export-${Date.now()}.csv"`,
    },
  })
}
