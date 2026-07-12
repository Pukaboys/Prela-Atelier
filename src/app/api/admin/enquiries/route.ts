import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { listBespokePaymentLinks } from '@/server/services/bespoke-payment-link-service'

export async function GET() {
  await requireAdmin()
  const [enquiries, links] = await Promise.all([
    prisma.bespokeEnquiry.findMany({ orderBy: { createdAt: 'desc' } }),
    listBespokePaymentLinks(),
  ])
  return NextResponse.json(enquiries.map((enquiry) => ({
    ...enquiry,
    paymentLinks: links.filter((link) => link.enquiryId === enquiry.id),
  })))
}
