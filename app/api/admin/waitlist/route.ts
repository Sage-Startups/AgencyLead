import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { leadsToCSV } from '@/lib/export'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')
  const search = searchParams.get('search') || ''

  const signups = await prisma.waitlistSignup.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    } : {},
    orderBy: { createdAt: 'desc' },
  })

  if (format === 'csv') {
    const csv = leadsToCSV(signups.map(s => ({
      businessName: s.name, niche: s.buyerType || '', city: '', state: '',
      zipCode: '', websiteUrl: '', email: s.email, phone: '',
      googleRating: '', reviewCount: '', websiteQuality: '', opportunityScore: '',
      recommendedService: s.mainService || '', status: s.status,
      generalNotes: s.message || '',
    })))
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="waitlist-${Date.now()}.csv"`,
      }
    })
  }

  return NextResponse.json(signups)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id, status } = await req.json()
  const updated = await prisma.waitlistSignup.update({ where: { id }, data: { status } })
  return NextResponse.json(updated)
}
