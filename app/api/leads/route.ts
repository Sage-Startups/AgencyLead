import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateOpportunityScore } from '@/lib/scoring'
import { isDemoUser, DEMO_READONLY_MESSAGE } from '@/lib/demo'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const niche = searchParams.get('niche') || ''
  const state = searchParams.get('state') || ''
  const status = searchParams.get('status') || ''
  const minScore = parseInt(searchParams.get('minScore') || '0')

  const leads = await prisma.lead.findMany({
    where: {
      userId: session.userId,
      ...(search ? { businessName: { contains: search, mode: 'insensitive' } } : {}),
      ...(niche ? { niche: { contains: niche, mode: 'insensitive' } } : {}),
      ...(state ? { state } : {}),
      ...(status ? { status } : {}),
      ...(minScore ? { opportunityScore: { gte: minScore } } : {}),
    },
    orderBy: { opportunityScore: 'desc' },
    include: { aiAudits: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (await isDemoUser(session.userId)) {
    return NextResponse.json({ error: DEMO_READONLY_MESSAGE }, { status: 403 })
  }

  const data = await req.json()
  const score = calculateOpportunityScore({
    websiteUrl: data.websiteUrl,
    websiteQuality: data.websiteQuality || 'unknown',
    googleRating: data.googleRating,
    reviewCount: data.reviewCount,
    hasClearCta: data.hasClearCta || false,
    hasQuoteForm: data.hasQuoteForm || false,
    seoNotes: data.seoNotes,
  })

  const lead = await prisma.lead.create({
    data: {
      userId: session.userId,
      businessName: data.businessName,
      niche: data.niche,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      websiteUrl: data.websiteUrl || null,
      email: data.email,
      phone: data.phone,
      googleRating: data.googleRating ? parseFloat(data.googleRating) : null,
      reviewCount: data.reviewCount ? parseInt(data.reviewCount) : null,
      websiteQuality: data.websiteQuality || 'unknown',
      hasClearCta: data.hasClearCta || false,
      hasQuoteForm: data.hasQuoteForm || false,
      seoNotes: data.seoNotes,
      generalNotes: data.generalNotes,
      opportunityScore: score,
      recommendedService: data.recommendedService,
      status: 'new',
    },
  })
  await prisma.activityLog.create({
    data: { userId: session.userId, actionType: 'lead_created', description: `Created lead: ${data.businessName}` }
  })
  return NextResponse.json(lead)
}
