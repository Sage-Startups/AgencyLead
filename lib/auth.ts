import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_COOKIE = 'agencylead_session'

// Resolve the signing secret lazily so a missing value fails loudly at request
// time in production instead of silently signing tokens with a public string.
function getSecret() {
  const value = process.env.APP_SECRET
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('APP_SECRET environment variable is required in production. Generate one with: openssl rand -base64 32')
    }
    // Development-only fallback so local dev runs without extra setup.
    return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod')
  }
  return new TextEncoder().encode(value)
}

export async function signToken(payload: { userId: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { userId: string; role: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  return prisma.user.findUnique({ where: { id: session.userId } })
}

export { SESSION_COOKIE }
