import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateOpportunityScore } from '@/lib/scoring'
import { isDemoUser, DEMO_READONLY_MESSAGE } from '@/lib/demo'
import { checkLeadQuota } from '@/lib/plans'

/**
 * Save selected AI suggestions as leads.
 *
 * They are stored with source='ai_suggested' and verified=false, and with no
 * rating, review count or website data, because the model had no way to
 * establish any of that. The opportunity score is therefore also left at zero
 * until the user fills in the real details — scoring invented inputs would
 * produce a confident number backed by nothing.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (await isDemoUser(session.userId)) {
    return NextResponse.json({ error: DEMO_READONLY_MESSAGE }, { status: 403 })
  }

  const { suggestions } = await req.json()
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return NextResponse.json({ error: 'No suggestions selected.' }, { status: 400 })
  }

  const account = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const quota = await checkLeadQuota(account, suggestions.length)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Adding ${suggestions.length} leads would exceed your plan. ${quota.message}`,
        code: 'quota_exceeded',
        used: quota.used,
        limit: quota.limit,
      },
      { status: 402 }
    )
  }

  let saved = 0
  for (const s of suggestions) {
    const businessName = String(s.businessName || '').trim()
    const niche = String(s.niche || '').trim()
    const city = String(s.city || '').trim()
    const state = String(s.state || '').trim()
    if (!businessName || !niche || !city || !state) continue

    const notes = [s.whyProspect, s.verifyFirst ? `To verify: ${s.verifyFirst}` : '']
      .filter(Boolean)
      .join('\n\n')

    try {
      await prisma.lead.create({
        data: {
          userId: session.userId,
          businessName,
          niche,
          city,
          state,
          // Deliberately blank: the model could not observe any of this.
          websiteUrl: null,
          email: null,
          phone: null,
          googleRating: null,
          reviewCount: null,
          websiteQuality: 'unknown',
          hasClearCta: false,
          hasQuoteForm: false,
          seoNotes: null,
          generalNotes: null,
          // Score stays 0 until real details are entered.
          opportunityScore: calculateOpportunityScore({
            websiteUrl: null,
            websiteQuality: 'unknown',
            googleRating: null,
            reviewCount: null,
            hasClearCta: false,
            hasQuoteForm: false,
            seoNotes: null,
          }),
          status: 'new',
          source: 'ai_suggested',
          verified: false,
          discoveryNotes: notes || null,
        },
      })
      saved++
    } catch {
      // Skip malformed rows rather than failing the whole batch.
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      actionType: 'leads_discovered_saved',
      description: `Saved ${saved} AI-suggested prospects for verification`,
    },
  })

  return NextResponse.json({ ok: true, saved })
}
