import type { Metadata } from 'next'
import Link from 'next/link'
import { getBespokePaymentLink } from '@/server/services/bespoke-payment-link-service'
import { CustomPaymentForm } from './CustomPaymentForm'

export const metadata: Metadata = { title: 'Private Payment - Prela Atelier' }
export const dynamic = 'force-dynamic'

export default async function CustomPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const link = await getBespokePaymentLink(token)

  if (!link) {
    return (
      <div className="min-h-screen bg-cream pt-36 pb-24 px-6 text-center">
        <h1 className="font-serif text-5xl text-stone">Payment link not found.</h1>
        <Link href="/contact" className="btn-primary inline-block mt-8">Contact Us</Link>
      </div>
    )
  }

  if (link.status === 'paid') {
    return (
      <div className="min-h-screen bg-cream pt-36 pb-24 px-6 text-center">
        <p className="section-eyebrow">Private Payment Link</p>
        <h1 className="font-serif text-5xl text-stone mt-4">This payment has already been completed.</h1>
        {link.orderCode ? (
          <p className="font-sans text-stone-mid mt-4">Order reference: {link.orderCode}</p>
        ) : null}
      </div>
    )
  }

  if (link.status !== 'open') {
    return (
      <div className="min-h-screen bg-cream pt-36 pb-24 px-6 text-center">
        <h1 className="font-serif text-5xl text-stone">This payment link is no longer active.</h1>
        <Link href="/contact" className="btn-primary inline-block mt-8">Contact Us</Link>
      </div>
    )
  }

  return (
    <CustomPaymentForm
      token={link.token}
      title={link.title}
      description={link.description}
      amountEur={link.amountEur}
      customerName={link.customerName}
      customerEmail={link.customerEmail}
    />
  )
}
