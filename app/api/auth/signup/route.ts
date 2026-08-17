import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, SESSION_COOKIE } from '@/lib/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'

// Public endpoint — cap account creation per IP.
const SIGNUP_MAX = 5
const SIGNUP_WINDOW_MS = 60 * 60 * 1000

const MIN_PASSWORD_LENGTH = 8

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  function fail(status: number, message: string) {
    if (isJson) return NextResponse.json({ error: message }, { status })
    const url = new URL('/signup', req.url)
    url.searchParams.set('error', message)
    return NextResponse.redirect(url, 303)
  }

  if (rateLimit(`signup:${clientIp(req)}`, SIGNUP_MAX, SIGNUP_WINDOW_MS)) {
    return fail(429, 'Too many sign-up attempts. Please try again later.')
  }

  try {
    let email: string, password: string, fullName: string, companyName: string

    if (isJson) {
      const body = await req.json()
      email = body.email
      password = body.password
      fullName = body.fullName
      companyName = body.companyName
    } else {
      const form = await req.formData()
      email = form.get('email') as string
      password = form.get('password') as string
      fullName = form.get('fullName') as string
      companyName = form.get('companyName') as string
    }

    if (!email || !password) {
      return fail(400, 'Email and password are required.')
    }

    const normalized = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return fail(400, 'Please enter a valid email address.')
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return fail(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    }

    const existing = await prisma.user.findUnique({ where: { email: normalized } })
    if (existing) {
      // Deliberately vague: do not confirm which addresses are registered.
      return fail(409, 'That email address cannot be used. Try logging in instead.')
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        fullName: fullName?.trim() || null,
        companyName: companyName?.trim() || null,
        role: 'user',
        plan: 'free',
      },
    })

    await prisma.activityLog.create({
      data: { userId: user.id, actionType: 'user_signup', description: `${user.email} created an account` },
    })

    // Fire-and-forget: the account already exists, so a mail failure must not
    // turn a successful signup into an error for the user.
    void sendWelcomeEmail(user.email, user.fullName)

    // Sign the new user straight in.
    const token = await signToken({ userId: user.id, role: user.role })
    const response = isJson
      ? NextResponse.json({ ok: true, plan: user.plan })
      : NextResponse.redirect(new URL('/dashboard', req.url), 303)

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error(err)
    return fail(500, 'Could not create your account. Please try again.')
  }
}
