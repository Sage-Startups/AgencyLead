import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isPlanId } from '@/lib/plans'

const ROLES = ['user', 'admin', 'superadmin']
const SUB_STATUSES = ['', 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid']

/** Only a superadmin may read or modify other accounts. */
async function requireSuperAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (session.role !== 'superadmin') {
    return { error: NextResponse.json({ error: 'Super admin access required' }, { status: 403 }) }
  }
  return { session }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { leads: true, aiAudits: true, importBatches: true } } },
  })
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { passwordHash: _omit, ...safe } = user
  void _omit
  return NextResponse.json(safe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}

  // --- Profile ---
  if (body.fullName !== undefined) data.fullName = String(body.fullName).trim() || null
  if (body.companyName !== undefined) data.companyName = String(body.companyName).trim() || null

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    const clash = await prisma.user.findUnique({ where: { email } })
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: 'Another account already uses that email.' }, { status: 409 })
    }
    data.email = email
  }

  // --- Role, with lockout protection ---
  if (body.role !== undefined) {
    const role = String(body.role)
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    // Do not let the last superadmin (or yourself) lose super admin access,
    // which would lock everyone out of this page permanently.
    if (target.role === 'superadmin' && role !== 'superadmin') {
      if (target.id === session!.userId) {
        return NextResponse.json(
          { error: 'You cannot remove your own super admin access.' },
          { status: 400 }
        )
      }
      const remaining = await prisma.user.count({ where: { role: 'superadmin', id: { not: id } } })
      if (remaining === 0) {
        return NextResponse.json(
          { error: 'This is the only super admin account. Promote another account first.' },
          { status: 400 }
        )
      }
    }
    data.role = role
  }

  // --- Subscription ---
  if (body.plan !== undefined) {
    const plan = String(body.plan)
    if (!isPlanId(plan)) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    data.plan = plan
  }

  if (body.subscriptionStatus !== undefined) {
    const status = String(body.subscriptionStatus)
    if (!SUB_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid subscription status.' }, { status: 400 })
    }
    data.subscriptionStatus = status || null
  }

  if (body.cancelAtPeriodEnd !== undefined) {
    data.cancelAtPeriodEnd = Boolean(body.cancelAtPeriodEnd)
  }

  if (body.currentPeriodEnd !== undefined) {
    const raw = String(body.currentPeriodEnd).trim()
    if (!raw) {
      data.currentPeriodEnd = null
    } else {
      const d = new Date(raw)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid renewal date.' }, { status: 400 })
      }
      data.currentPeriodEnd = d
    }
  }

  // --- Dates ---
  if (body.createdAt !== undefined) {
    const d = new Date(String(body.createdAt))
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid join date.' }, { status: 400 })
    }
    data.createdAt = d
  }

  // --- Password reset ---
  if (body.password) {
    const password = String(body.password)
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    data.passwordHash = await bcrypt.hash(password, 10)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const updated = await prisma.user.update({ where: { id }, data })

  const changed = Object.keys(data)
    .map(k => (k === 'passwordHash' ? 'password' : k))
    .join(', ')
  await prisma.activityLog.create({
    data: {
      userId: session!.userId,
      actionType: 'admin_user_updated',
      description: `Super admin updated ${updated.email} (${changed})`,
    },
  })

  const { passwordHash: _omit, ...safe } = updated
  void _omit
  return NextResponse.json(safe)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSuperAdmin()
  if (error) return error

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  if (target.id === session!.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }
  if (target.role === 'superadmin') {
    const remaining = await prisma.user.count({ where: { role: 'superadmin', id: { not: id } } })
    if (remaining === 0) {
      return NextResponse.json(
        { error: 'This is the only super admin account and cannot be deleted.' },
        { status: 400 }
      )
    }
  }

  // Child rows reference the user, so remove them in order inside a
  // transaction. Activity logs are detached rather than deleted so the audit
  // trail of what happened on the platform survives the account.
  await prisma.$transaction([
    prisma.aiAudit.deleteMany({ where: { userId: id } }),
    prisma.lead.deleteMany({ where: { userId: id } }),
    prisma.importBatch.deleteMany({ where: { userId: id } }),
    prisma.activityLog.updateMany({ where: { userId: id }, data: { userId: null } }),
    prisma.user.delete({ where: { id } }),
  ])

  await prisma.activityLog.create({
    data: {
      userId: session!.userId,
      actionType: 'admin_user_deleted',
      description: `Super admin deleted account ${target.email} and all of its leads`,
    },
  })

  return NextResponse.json({ ok: true })
}
