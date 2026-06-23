import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let email: string, password: string

    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = body.email
      password = body.password
    } else {
      const form = await req.formData()
      email = form.get('email') as string
      password = form.get('password') as string
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await prisma.activityLog.create({
      data: { userId: user.id, actionType: 'user_login', description: `${user.email} logged in` }
    })

    const token = await signToken({ userId: user.id, role: user.role })
    const isJson = contentType.includes('application/json')
    const response = isJson
      ? NextResponse.json({ ok: true, role: user.role })
      : NextResponse.redirect(new URL('/dashboard', req.url))

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
