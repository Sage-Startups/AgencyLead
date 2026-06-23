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

  // Coerce numeric fields (forms send them as strings) and merge with existing
  // values so both full edits and partial updates (e.g. status-only) work.
  const num = (v: unknown, fallback: number | null, parse: (s: string) => number) => {
    if (v === undefined) return fallback
    if (v === '' || v === null) return null
    return typeof v === 'number' ? v : parse(String(v))
  }

  const googleRating = num(data.googleRating, existing.googleRating, parseFloat)
  const reviewCount = num(data.reviewCount, existing.reviewCount, (s) => parseInt(s, 10))

  const score = calculateOpportunityScore({
    websiteUrl: data.websiteUrl ?? existing.websiteUrl,
    websiteQuality: data.websiteQuality ?? existing.websiteQuality,
    googleRating,
    reviewCount,
    hasClearCta: data.hasClearCta ?? existing.hasClearCta,
    hasQuoteForm: data.hasQuoteForm ?? existing.hasQuoteForm,
    seoNotes: data.seoNotes ?? existing.seoNotes,
  })

  const rest = { ...data }
  delete rest.googleRating
  delete rest.reviewCount
  delete rest.id
  delete rest.aiAudits

  const lead = await prisma.lead.update({
    where: { id },
    data: { ...rest, googleRating, reviewCount, opportunityScore: score, updatedAt: new Date() },
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
