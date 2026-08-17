import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateOpportunityScore } from '@/lib/scoring'
import { isDemoUser, DEMO_READONLY_MESSAGE } from '@/lib/demo'
import { checkLeadQuota } from '@/lib/plans'

const REQUIRED = ['business_name', 'niche', 'city', 'state']

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (await isDemoUser(session.userId)) {
    return NextResponse.json({ error: DEMO_READONLY_MESSAGE }, { status: 403 })
  }

  const { rows, fileName } = await req.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const account = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const quota = await checkLeadQuota(account, rows.length)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `This import would add ${rows.length} leads. ${quota.message}`,
        code: 'quota_exceeded',
        used: quota.used,
        limit: quota.limit,
      },
      { status: 402 }
    )
  }

  const headers = Object.keys(rows[0]).map((h: string) => h.toLowerCase().trim().replace(/ /g, '_'))
  const missing = REQUIRED.filter(r => !headers.includes(r))
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required columns: ${missing.join(', ')}` }, { status: 400 })
  }

  let successful = 0
  let failed = 0

  for (const row of rows) {
    try {
      const get = (k: string) => row[k] || row[k.replace(/_/g, ' ')] || ''
      const googleRating = parseFloat(get('google_rating')) || null
      const reviewCount = parseInt(get('review_count')) || null
      const websiteQuality = get('website_quality') || 'unknown'
      const hasClearCta = get('has_clear_cta')?.toLowerCase() === 'true'
      const hasQuoteForm = get('has_quote_form')?.toLowerCase() === 'true'
      const websiteUrl = get('website_url') || null

      const score = calculateOpportunityScore({ websiteUrl, websiteQuality, googleRating, reviewCount, hasClearCta, hasQuoteForm, seoNotes: get('seo_notes') })

      await prisma.lead.create({
        data: {
          userId: session.userId,
          businessName: get('business_name'),
          niche: get('niche'),
          city: get('city'),
          state: get('state'),
          zipCode: get('zip_code') || null,
          websiteUrl,
          email: get('email') || null,
          phone: get('phone') || null,
          googleRating,
          reviewCount,
          websiteQuality,
          hasClearCta,
          hasQuoteForm,
          seoNotes: get('seo_notes') || null,
          generalNotes: get('notes') || null,
          opportunityScore: score,
          status: 'new',
        },
      })
      successful++
    } catch {
      failed++
    }
  }

  await prisma.importBatch.create({
    data: { userId: session.userId, fileName: fileName || 'import.csv', totalRows: rows.length, successfulRows: successful, failedRows: failed }
  })
  await prisma.activityLog.create({
    data: { userId: session.userId, actionType: 'lead_imported', description: `Imported ${successful}/${rows.length} leads from ${fileName}` }
  })

  return NextResponse.json({ ok: true, successful, failed, total: rows.length })
}
