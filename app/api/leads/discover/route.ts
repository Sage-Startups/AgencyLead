import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import OpenAI from 'openai'
import { rateLimit } from '@/lib/rate-limit'

/**
 * AI lead discovery.
 *
 * IMPORTANT: the language model cannot browse the web. It cannot look up a
 * live business directory, and it has no access to Google ratings, review
 * counts, or whether a company currently has a website. Everything it returns
 * is a research starting point drawn from training data, which may be out of
 * date or simply wrong.
 *
 * The prompt therefore forbids inventing any verifiable metric. Suggestions
 * come back with a name, niche and location only, plus why the prospect type
 * is worth pursuing and what the user must check. Ratings, review counts and
 * website quality are deliberately left empty for the user to fill in after
 * looking the business up themselves.
 */
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Discovery costs an OpenAI call, so cap it per user.
const RATE_MAX = 3
const RATE_WINDOW_MS = 10 * 60 * 1000

const MAX_SUGGESTIONS = 15

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (rateLimit(`discover:${session.userId}`, RATE_MAX, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Discovery limit reached. Please wait a few minutes before searching again.' },
      { status: 429 }
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Lead discovery is not configured. Add an OPENAI_API_KEY environment variable to enable it.' },
      { status: 503 }
    )
  }

  const body = await req.json()
  const niche = String(body.niche || '').trim()
  const city = String(body.city || '').trim()
  const state = String(body.state || '').trim()
  const service = String(body.service || '').trim()
  const idealClient = String(body.idealClient || '').trim()
  const count = Math.min(Math.max(parseInt(String(body.count || 8)) || 8, 1), MAX_SUGGESTIONS)

  if (!niche || !city || !state) {
    return NextResponse.json(
      { error: 'Niche, city and state are required to search for prospects.' },
      { status: 400 }
    )
  }

  const prompt = `You are helping a US web design / SEO agency build a prospecting shortlist.

The agency sells: ${service || 'web design and SEO services'}
Target industry: ${niche}
Target location: ${city}, ${state}
${idealClient ? `What makes a good client for them: ${idealClient}` : ''}

Suggest up to ${count} candidate local businesses of this type in this area that could be worth researching as prospects.

CRITICAL RULES — follow these exactly:
- You cannot browse the web. Do NOT state or imply that you have checked any business's current website, Google rating, review count, or online presence.
- Do NOT invent ratings, review counts, phone numbers, email addresses, or website URLs. Leave those out entirely.
- Do NOT claim a specific business has a bad website or poor SEO. You have no way to know that.
- Prefer describing realistic, plausible local business names of this type in this area. Treat every one as an unconfirmed lead the user must verify.
- "whyProspect" must describe why this TYPE of business in this market is worth approaching, not a claim about that specific company's current site.

Return a JSON object with exactly this shape:
{
  "suggestions": [
    {
      "businessName": "A plausible local business name",
      "niche": "${niche}",
      "city": "${city}",
      "state": "${state}",
      "whyProspect": "1-2 sentences on why this type of business in this market tends to need these services",
      "verifyFirst": "Specific things the user should check before making contact"
    }
  ],
  "searchStrategy": "3-4 sentences on how to find and qualify more businesses like these: which directories, search terms, and signals to look for",
  "suggestedSearchTerms": ["a Google or Maps search string", "another search string", "another"]
}`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const data = JSON.parse(completion.choices[0].message.content || '{}')

    // Normalise and strip anything the model should not have supplied.
    const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
      .slice(0, count)
      .map((s: Record<string, unknown>) => ({
        businessName: String(s.businessName || '').trim(),
        niche: String(s.niche || niche).trim(),
        city: String(s.city || city).trim(),
        state: String(s.state || state).trim().toUpperCase().slice(0, 2),
        whyProspect: String(s.whyProspect || '').trim(),
        verifyFirst: String(s.verifyFirst || '').trim(),
      }))
      .filter((s: { businessName: string }) => s.businessName.length > 0)

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        actionType: 'leads_discovered',
        description: `AI suggested ${suggestions.length} ${niche} prospects in ${city}, ${state}`,
      },
    })

    return NextResponse.json({
      suggestions,
      searchStrategy: String(data.searchStrategy || ''),
      suggestedSearchTerms: Array.isArray(data.suggestedSearchTerms)
        ? data.suggestedSearchTerms.map((t: unknown) => String(t)).slice(0, 6)
        : [],
    })
  } catch (err) {
    console.error('Lead discovery error:', err)
    return NextResponse.json({ error: 'Could not generate suggestions. Please try again.' }, { status: 500 })
  }
}
