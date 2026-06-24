import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policies/PolicyPage'

export const metadata: Metadata = {
  title: 'Returns and Refund Policy - Prela Atelier',
  description: 'Return eligibility, refunds, damaged items, and bespoke order rules for Prela Atelier.',
}

const UPDATED = 'April 15, 2026'

export default function ReturnsPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Customer Care"
      title="Returns & Refunds"
      intro="We want every Prela Atelier piece to arrive safely and be considered with confidence. This policy explains eligibility, return steps, refunds, and bespoke-order exclusions."
      updated={UPDATED}
      sections={[
        {
          title: 'Return Eligibility',
          body: [
            'Eligible ready-made items may be returned within 14 days of delivery if they are unused, undamaged, and returned in their original packaging with all included documentation.',
            'To begin a return, contact us before sending anything back. Returns sent without prior approval may be delayed or refused.',
          ],
        },
        {
          title: 'Non-Returnable Items',
          items: [
            'Bespoke, made-to-order, personalized, engraved, or custom-dimension pieces.',
            'Items damaged through misuse, incorrect care, impact, staining, or exposure to unsuitable cleaning products.',
            'Items returned without original protective packaging where damage occurs during return transit.',
          ],
        },
        {
          title: 'Natural Stone Variation',
          body: [
            'Natural stone varies in veining, tone, pores, mineral marks, and movement. These variations are part of the material character and are not considered defects.',
            'Product photography represents the design and material family, but every carved piece is unique.',
          ],
        },
        {
          title: 'Return Shipping',
          body: [
            'Unless an item arrived damaged or incorrect, return shipping costs are the responsibility of the customer. We recommend using a tracked and insured service suitable for fragile stone goods.',
            'The customer is responsible for ensuring the item is packed safely for return transit.',
          ],
        },
        {
          title: 'Refunds',
          body: [
            'After we receive and inspect the returned item, we will notify you whether the refund has been approved. Approved refunds are issued to the original payment method.',
            'Depending on your bank or payment provider, the refund may take 5 to 10 business days to appear after processing.',
          ],
        },
        {
          title: 'Damaged or Incorrect Items',
          body: [
            'If your order arrives damaged or incorrect, contact us within 48 hours of delivery with your order reference and clear photos of the item and packaging.',
            'We will review the case and offer the most appropriate solution, which may include replacement, repair support, refund, or courier claim assistance.',
          ],
        },
      ]}
      note="This policy does not limit any mandatory consumer rights that may apply in your jurisdiction."
    />
  )
}
