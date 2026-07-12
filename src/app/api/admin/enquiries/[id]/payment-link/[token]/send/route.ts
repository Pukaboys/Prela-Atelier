import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendBespokePaymentLinkEmail } from '@/lib/mailer'
import { getBespokePaymentLink } from '@/server/services/bespoke-payment-link-service'

function getAppUrl(request: NextRequest) {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  return rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; token: string }> },
) {
  await requireAdmin()
  const { id, token } = await params
  const enquiryId = Number(id)
  if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
    return NextResponse.json({ error: 'Invalid enquiry id.' }, { status: 400 })
  }

  const link = await getBespokePaymentLink(token)
  if (!link || link.enquiryId !== enquiryId) {
    return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 })
  }

  if (link.status !== 'open') {
    return NextResponse.json({ error: 'Only open payment links can be emailed.' }, { status: 409 })
  }

  const paymentUrl = new URL(`/custom-payment/${link.token}`, getAppUrl(request)).toString()
  await sendBespokePaymentLinkEmail({
    to: link.customerEmail,
    customerName: link.customerName,
    title: link.title,
    amount: link.amountEur,
    paymentUrl,
  })

  return NextResponse.json({ ok: true })
}
