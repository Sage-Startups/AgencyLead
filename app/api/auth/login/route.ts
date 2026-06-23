import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  // Form submissions get a redirect back to /login with a readable message;
  // JSON clients get a JSON error. Never dump raw JSON onto a browser page.
  function fail(status: number, message: string) {
    if (isJson) return NextResponse.json({ error: message }, { status })
    const url = new URL('/login', req.url)
    url.searchParams.set('error', message)
    return NextResponse.redirect(url, 303)
  }

  try {
    let email: string, password: string

    if (isJson) {
      const body = await req.json()
      email = body.email
      password = body.password
    } else {
      const form = await req.formData()
      email = form.get('email') as string
      password = form.get('password') as string
    }

    if (!email || !password) {
      return fail(400, 'Email and password are required.')
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return fail(401, 'Invalid email or password.')
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return fail(401, 'Invalid email or password.')
    }

    await prisma.activityLog.create({
      data: { userId: user.id, actionType: 'user_login', description: `${user.email} logged in` }
    })

    const token = await signToken({ userId: user.id, role: user.role })
    const response = isJson
      ? NextResponse.json({ ok: true, role: user.role })
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
    return fail(500, 'Something went wrong. Please try again.')
  }
}
