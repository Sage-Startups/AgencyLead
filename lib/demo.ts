import { prisma } from './prisma'

// The public demo logs everyone in as one shared account. To keep the demo
// from being vandalized or having its seed data deleted, that account is
// treated as read-only for lead mutations.
export const DEMO_EMAIL = (process.env.DEMO_EMAIL || 'demo@agencyleadradar.com').toLowerCase()

export const DEMO_READONLY_MESSAGE =
  'This is a read-only demo account. Sign up to add, edit, or delete your own leads.'

export async function isDemoUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  return user?.email?.toLowerCase() === DEMO_EMAIL
}
