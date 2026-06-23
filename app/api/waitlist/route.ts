import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
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

export async function GET() {
  const signups = await prisma.waitlistSignup.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(signups)
}
