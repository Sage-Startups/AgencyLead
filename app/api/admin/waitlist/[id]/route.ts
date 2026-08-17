import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const STATUSES = ['new', 'contacted', 'interested', 'not_interested']

async function requireStaff() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireStaff()
  if (error) return error

  const { id } = await params
  const existing = await prisma.waitlistSignup.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Signup not found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = String(body.name).trim()
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    data.email = email
  }
  if (body.companyName !== undefined) data.companyName = String(body.companyName).trim() || null
  if (body.buyerType !== undefined) data.buyerType = String(body.buyerType).trim() || null
  if (body.mainService !== undefined) data.mainService = String(body.mainService).trim() || null
  if (body.message !== undefined) data.message = String(body.message).trim() || null

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    data.status = status
  }

  if (body.createdAt !== undefined) {
    const d = new Date(String(body.createdAt))
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 })
    }
    data.createdAt = d
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const updated = await prisma.waitlistSignup.update({ where: { id }, data })

  await prisma.activityLog.create({
    data: {
      userId: session!.userId,
      actionType: 'admin_waitlist_updated',
      description: `Updated waitlist entry ${updated.email}`,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireStaff()
  if (error) return error

  const { id } = await params
  const existing = await prisma.waitlistSignup.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Signup not found' }, { status: 404 })

  await prisma.waitlistSignup.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      userId: session!.userId,
      actionType: 'admin_waitlist_deleted',
      description: `Deleted waitlist entry ${existing.email}`,
    },
  })

  return NextResponse.json({ ok: true })
}
