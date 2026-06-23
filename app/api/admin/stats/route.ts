import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [users, leads, audits, waitlist, imports, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.aiAudit.count(),
    prisma.waitlistSignup.count(),
    prisma.importBatch.count(),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  return NextResponse.json({ users, leads, audits, waitlist, imports, recentActivity })
}
