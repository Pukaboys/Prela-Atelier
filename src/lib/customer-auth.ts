import crypto from 'crypto'
import prisma from '@/lib/db'

const CODE_TTL_MS = 10 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const CODE_PREFIX = 'mobile_code:'
const SESSION_PREFIX = 'mobile_session:'

type CodeRecord = {
  email: string
  codeHash: string
  expiresAt: string
  attempts: number
}

type SessionRecord = {
  email: string
  expiresAt: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function digest(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function secret() {
  return process.env.SESSION_SECRET ?? 'prela-mobile-auth-development-secret'
}

function codeKey(email: string) {
  return `${CODE_PREFIX}${digest(normalizeEmail(email)).slice(0, 48)}`
}

function sessionKey(token: string) {
  return `${SESSION_PREFIX}${digest(token).slice(0, 48)}`
}

function getCodeHash(email: string, code: string) {
  return digest(`${normalizeEmail(email)}:${code}:${secret()}`)
}

export function generateCustomerLoginCode() {
  return String(crypto.randomInt(100000, 1000000))
}

export async function storeCustomerLoginCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email)
  const record: CodeRecord = {
    email: normalizedEmail,
    codeHash: getCodeHash(normalizedEmail, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    attempts: 0,
  }

  await prisma.setting.upsert({
    where: { key: codeKey(normalizedEmail) },
    update: { value: JSON.stringify(record) },
    create: { key: codeKey(normalizedEmail), value: JSON.stringify(record) },
  })
}

export async function verifyCustomerLoginCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email)
  const key = codeKey(normalizedEmail)
  const row = await prisma.setting.findUnique({ where: { key } })

  if (!row) return null

  const record = JSON.parse(row.value) as CodeRecord
  if (new Date(record.expiresAt).getTime() < Date.now() || record.attempts >= 5) {
    await prisma.setting.delete({ where: { key } }).catch(() => null)
    return null
  }

  if (record.codeHash !== getCodeHash(normalizedEmail, code.trim())) {
    await prisma.setting.update({
      where: { key },
      data: { value: JSON.stringify({ ...record, attempts: record.attempts + 1 }) },
    })
    return null
  }

  await prisma.setting.delete({ where: { key } }).catch(() => null)

  const token = crypto.randomBytes(32).toString('hex')
  const session: SessionRecord = {
    email: normalizedEmail,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }

  await prisma.setting.upsert({
    where: { key: sessionKey(token) },
    update: { value: JSON.stringify(session) },
    create: { key: sessionKey(token), value: JSON.stringify(session) },
  })

  return { email: normalizedEmail, token }
}

export async function getCustomerEmailFromToken(token: string | null) {
  if (!token) return null

  const key = sessionKey(token)
  const row = await prisma.setting.findUnique({ where: { key } })
  if (!row) return null

  const session = JSON.parse(row.value) as SessionRecord
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await prisma.setting.delete({ where: { key } }).catch(() => null)
    return null
  }

  return normalizeEmail(session.email)
}
