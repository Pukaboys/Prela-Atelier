import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policies/PolicyPage'

export const metadata: Metadata = {
  title: 'Shipping Policy - Prela Atelier',
  description: 'Shipping timelines, packaging, delivery regions, duties, and damage reporting for Prela Atelier orders.',
}

const UPDATED = 'April 15, 2026'

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Delivery Information"
      title="Shipping Policy"
      intro="Each Prela Atelier piece is inspected, protected, and packed with care before it leaves our atelier. This policy explains how we prepare, ship, and support orders in transit."
      updated={UPDATED}
      sections={[
        {
          title: 'Processing Times',
          body: [
            'Ready-made products are normally prepared for dispatch within 2 to 5 business days after payment confirmation, unless a different lead time is shown on the product page.',
            'Bespoke commissions, made-to-order pieces, and limited material requests follow the timeline confirmed in writing during the quotation or approval process.',
          ],
        },
        {
          title: 'Shipping Destinations',
          body: [
            'We ship from Albania to Albania, Europe, and selected international destinations. If your country is not available at checkout, please contact us before placing your order so we can confirm availability and cost.',
          ],
          items: [
            'Albania shipping is currently free.',
            'European and international shipping rates are calculated at checkout based on destination and order value.',
            'Orders at or above the free-shipping threshold shown at checkout may qualify for complimentary shipping.',
          ],
        },
        {
          title: 'Packaging',
          body: [
            'Natural stone is heavy and fragile. Every order is packed with protective wrapping, reinforced padding, and outer packaging suitable for the item size and destination.',
            'Where applicable, pieces include stone documentation or a certificate of authenticity inside the package.',
          ],
        },
        {
          title: 'Tracking',
          body: [
            'When tracking is available, we will send tracking information by email after dispatch. Tracking updates depend on the courier and destination country.',
            'If you have not received tracking within the expected dispatch window, contact us with your order reference.',
          ],
        },
        {
          title: 'Customs, Duties, and Taxes',
          body: [
            'International orders may be subject to customs duties, import taxes, brokerage charges, or local fees. These charges are set by the destination country and are the responsibility of the customer unless explicitly stated otherwise at checkout.',
          ],
        },
        {
          title: 'Damage in Transit',
          body: [
            'Please inspect your package as soon as it arrives. If an item appears damaged in transit, contact us within 48 hours of delivery with your order reference, photos of the item, photos of the packaging, and a short description of the issue.',
            'Keep the original packaging until the claim is resolved, as couriers may request evidence for inspection.',
          ],
        },
      ]}
      note="Need help with a delivery? Contact hello@prela-atelier.com with your order reference and we will assist you."
    />
  )
}
