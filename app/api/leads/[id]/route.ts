import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateOpportunityScore } from '@/lib/scoring'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const lead = await prisma.lead.findFirst({
    where: { id, userId: session.userId },
    include: { aiAudits: { orderBy: { createdAt: 'desc' } } },
  })
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lead)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const data = await req.json()

  const existing = await prisma.lead.findFirst({ where: { id, userId: session.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const score = calculateOpportunityScore({
    websiteUrl: data.websiteUrl ?? existing.websiteUrl,
    websiteQuality: data.websiteQuality ?? existing.websiteQuality,
    googleRating: data.googleRating ?? existing.googleRating,
    reviewCount: data.reviewCount ?? existing.reviewCount,
    hasClearCta: data.hasClearCta ?? existing.hasClearCta,
    hasQuoteForm: data.hasQuoteForm ?? existing.hasQuoteForm,
    seoNotes: data.seoNotes ?? existing.seoNotes,
  })

  const lead = await prisma.lead.update({
    where: { id },
    data: { ...data, opportunityScore: score, updatedAt: new Date() },
  })
  return NextResponse.json(lead)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.lead.findFirst({ where: { id, userId: session.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
