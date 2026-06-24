import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policies/PolicyPage'

export const metadata: Metadata = {
  title: 'Terms and Conditions - Prela Atelier',
  description: 'Terms for using the Prela Atelier website, placing orders, payments, shipping, bespoke commissions, and product variation.',
}

const UPDATED = 'April 15, 2026'

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal Information"
      title="Terms & Conditions"
      intro="These terms explain how the Prela Atelier website, product orders, payments, delivery, and bespoke commissions operate. Please read them before placing an order."
      updated={UPDATED}
      sections={[
        {
          title: 'Website Use',
          body: [
            'By using this website, you agree to use it lawfully and not to interfere with its security, availability, checkout flow, admin systems, or payment processes.',
            'We may update website content, product availability, prices, policies, and these terms from time to time.',
          ],
        },
        {
          title: 'Products and Natural Variation',
          body: [
            'Prela Atelier products are made from natural stone. Veining, tone, pores, mineral marks, and texture vary from piece to piece and are part of the character of the material.',
            'Images are provided to represent the design, material family, and finish, but the exact natural pattern of each piece cannot be guaranteed.',
          ],
        },
        {
          title: 'Orders and Acceptance',
          body: [
            'After you place an order, you may receive an order confirmation or payment instruction email. An order may be refused or cancelled if a product is unavailable, payment cannot be confirmed, shipping is not possible, or there is an obvious pricing or stock error.',
            'If we need to cancel an order after payment, we will contact you and arrange an appropriate refund.',
          ],
        },
        {
          title: 'Pricing, Currency, and Payment',
          body: [
            'Product prices are stored and processed in EUR. Currency selectors may show approximate converted display prices for customer convenience.',
            'Payment options may include PayPal, card payments, or bank transfer depending on availability. Orders paid by bank transfer are processed after payment is received and confirmed.',
          ],
        },
        {
          title: 'Shipping and Delivery',
          body: [
            'Delivery timelines are estimates and may vary due to courier operations, customs, destination country, holidays, or events outside our control.',
            'For international deliveries, customs duties, taxes, and local charges may apply and are the responsibility of the customer unless stated otherwise.',
          ],
        },
        {
          title: 'Returns and Refunds',
          body: [
            'Returns are handled according to our Returns & Refunds policy. Bespoke, personalized, engraved, or custom-dimension items are generally not returnable unless faulty or incorrect.',
          ],
        },
        {
          title: 'Bespoke Commissions',
          body: [
            'Bespoke enquiries do not create a confirmed order until scope, specifications, pricing, payment terms, and timeline are agreed.',
            'Because bespoke work is produced to client requirements, deposits, staged payments, and cancellation rules may differ from ready-made product orders.',
          ],
        },
        {
          title: 'Intellectual Property',
          body: [
            'Website content, photography, product names, text, layout, and brand materials belong to Prela Atelier or its licensors and may not be copied or reused without permission.',
          ],
        },
        {
          title: 'Limitation of Liability',
          body: [
            'To the maximum extent permitted by applicable law, Prela Atelier is not responsible for indirect, incidental, or consequential losses arising from use of the website, delayed delivery, or inability to use a product.',
            'Nothing in these terms limits any rights that cannot legally be limited.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'Questions about these terms can be sent to hello@prela-atelier.com.',
          ],
        },
      ]}
      note="These terms are provided as operational website terms and should be reviewed by a qualified legal professional before final production reliance."
    />
  )
}
