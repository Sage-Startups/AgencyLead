import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 })

  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: session.userId } })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const prompt = `You are an expert agency consultant. Based ONLY on the following business information, generate a professional lead audit and outreach pack for a US web design or SEO agency.

Business: ${lead.businessName}
Niche: ${lead.niche}
Location: ${lead.city}, ${lead.state}${lead.zipCode ? ` ${lead.zipCode}` : ''}
Website: ${lead.websiteUrl || 'None found'}
Website Quality: ${lead.websiteQuality}
Google Rating: ${lead.googleRating ?? 'Unknown'}
Review Count: ${lead.reviewCount ?? 'Unknown'}
Has Clear CTA: ${lead.hasClearCta ? 'Yes' : 'No'}
Has Quote/Contact Form: ${lead.hasQuoteForm ? 'Yes' : 'No'}
SEO Notes: ${lead.seoNotes || 'None'}
Opportunity Score: ${lead.opportunityScore}/100
Recommended Service: ${lead.recommendedService || 'Not specified'}

IMPORTANT: Only use the information above. Do not invent revenue, traffic, employees, or any data not provided. Use American English. Keep outreach polite, professional, and non-spammy.

Return a JSON object with exactly these fields:
{
  "auditSummary": "2-3 sentence business summary based on available info",
  "mainIssues": "Bullet-pointed list of 3-5 online presence weaknesses",
  "opportunityReason": "1-2 sentences explaining why this is a good prospect",
  "recommendedService": "The single best service to pitch",
  "suggestedOffer": "A specific, compelling offer to make (e.g. free audit, flat-rate redesign)",
  "coldEmail": "A complete, personalized cold email (subject line + body, under 150 words)",
  "dmMessage": "A short, friendly Instagram/Facebook DM (under 80 words)",
  "callOpener": "A confident, natural phone call opener (2-3 sentences)",
  "followUpMessage": "A polite follow-up email for 5-7 days later (under 100 words)"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content || '{}'
    const data = JSON.parse(raw)

    const audit = await prisma.aiAudit.create({
      data: {
        userId: session.userId,
        leadId,
        auditSummary: data.auditSummary || '',
        mainIssues: data.mainIssues || '',
        opportunityReason: data.opportunityReason || '',
        recommendedService: data.recommendedService || lead.recommendedService || '',
        suggestedOffer: data.suggestedOffer || '',
        coldEmail: data.coldEmail || '',
        dmMessage: data.dmMessage || '',
        callOpener: data.callOpener || '',
        followUpMessage: data.followUpMessage || '',
      },
    })

    await prisma.activityLog.create({
      data: { userId: session.userId, actionType: 'audit_generated', description: `AI audit generated for ${lead.businessName}` }
    })

    return NextResponse.json(audit)
  } catch (err) {
    console.error('OpenAI error:', err)
    return NextResponse.json({ error: 'AI generation failed. Please check your OpenAI API key.' }, { status: 500 })
  }
}
