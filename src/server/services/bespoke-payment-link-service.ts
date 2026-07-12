import { randomBytes } from 'crypto'
import prisma from '@/lib/db'

const SETTING_KEY = 'bespoke_payment_links'

export type BespokePaymentLinkStatus = 'open' | 'pending' | 'paid' | 'disabled'

export type BespokePaymentLink = {
  token: string
  enquiryId: number
  title: string
  description: string
  amountEur: number
  customerName: string
  customerEmail: string
  status: BespokePaymentLinkStatus
  createdAt: string
  paidAt?: string
  orderCode?: string
  pokOrderId?: string
}

function parseLinks(value: string | null | undefined): BespokePaymentLink[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveLinks(links: BespokePaymentLink[]) {
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(links) },
    create: { key: SETTING_KEY, value: JSON.stringify(links) },
  })
}

export async function listBespokePaymentLinks() {
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
  return parseLinks(row?.value)
}

export async function getBespokePaymentLink(token: string) {
  const links = await listBespokePaymentLinks()
  return links.find((link) => link.token === token) ?? null
}

export async function listBespokePaymentLinksByEnquiry(enquiryId: number) {
  const links = await listBespokePaymentLinks()
  return links
    .filter((link) => link.enquiryId === enquiryId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createBespokePaymentLink(input: {
  enquiryId: number
  title: string
  description?: string
  amountEur: number
}) {
  const enquiry = await prisma.bespokeEnquiry.findUnique({ where: { id: input.enquiryId } })
  if (!enquiry) throw new Error('Enquiry not found.')

  const links = await listBespokePaymentLinks()
  const token = randomBytes(16).toString('hex')
  const link: BespokePaymentLink = {
    token,
    enquiryId: enquiry.id,
    title: input.title,
    description: input.description ?? '',
    amountEur: Math.round(input.amountEur * 100) / 100,
    customerName: enquiry.name,
    customerEmail: enquiry.email,
    status: 'open',
    createdAt: new Date().toISOString(),
  }

  await saveLinks([link, ...links])
  return link
}

export async function markBespokePaymentLinkPaid(
  token: string,
  data: { orderCode: string; pokOrderId: string },
) {
  const links = await listBespokePaymentLinks()
  const index = links.findIndex((link) => link.token === token)
  if (index < 0) return null

  if (links[index].status === 'paid') return links[index]

  links[index] = {
    ...links[index],
    status: 'paid',
    paidAt: new Date().toISOString(),
    orderCode: data.orderCode,
    pokOrderId: data.pokOrderId,
  }
  await saveLinks(links)

  await prisma.bespokeEnquiry.update({
    where: { id: links[index].enquiryId },
    data: { status: 'closed' },
  }).catch(() => null)

  return links[index]
}

export async function markBespokePaymentLinkPending(
  token: string,
  data: { orderCode: string },
) {
  const links = await listBespokePaymentLinks()
  const index = links.findIndex((link) => link.token === token)
  if (index < 0) return null

  if (links[index].status !== 'open') return links[index]

  links[index] = {
    ...links[index],
    status: 'pending',
    orderCode: data.orderCode,
  }
  await saveLinks(links)

  await prisma.bespokeEnquiry.update({
    where: { id: links[index].enquiryId },
    data: { status: 'closed' },
  }).catch(() => null)

  return links[index]
}
