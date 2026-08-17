import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'

// Public endpoint — cap submissions per IP so it can't be flooded by bots.
const WAITLIST_MAX = 5
const WAITLIST_WINDOW_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  if (rateLimit(`waitlist:${clientIp(req)}`, WAITLIST_MAX, WAITLIST_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again in a few minutes.' },
      { status: 429 }
    )
  }

  try {
    const { name, email, companyName, buyerType, mainService, message } = await req.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }
    const signup = await prisma.waitlistSignup.create({
      data: { name, email: email.toLowerCase(), companyName, buyerType, mainService, message }
    })
    await prisma.activityLog.create({
      data: { actionType: 'waitlist_signup', description: `${email} joined waitlist` }
    })
    return NextResponse.json({ ok: true, id: signup.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save signup' }, { status: 500 })
  }
}

// NOTE: There is deliberately no GET handler here. Waitlist signups contain
// personal data (name, email, company) and must never be readable from a
// public endpoint. Admins read them via GET /api/admin/waitlist, which is
// gated behind an authenticated session with role === 'admin'.
