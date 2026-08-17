import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const PROTECTED = ['/dashboard', '/admin']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('agencylead_session')?.value
  if (!token) return NextResponse.redirect(new URL('/demo', req.url))

  const session = await verifyToken(token)
  if (!session) return NextResponse.redirect(new URL('/demo', req.url))

  const isStaff = session.role === 'admin' || session.role === 'superadmin'
  if (pathname.startsWith('/admin') && !isStaff) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
