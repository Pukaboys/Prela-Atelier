import type { Metadata } from 'next'
import { PolicyPage } from '@/components/policies/PolicyPage'

export const metadata: Metadata = {
  title: 'Privacy Policy - Prela Atelier',
  description: 'How Prela Atelier collects, uses, stores, and protects customer and visitor information.',
}

const UPDATED = 'April 15, 2026'

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Data Protection"
      title="Privacy Policy"
      intro="Your privacy matters to us. This policy explains what information we collect, why we use it, and how we protect it when you browse, enquire, or purchase from Prela Atelier."
      updated={UPDATED}
      sections={[
        {
          title: 'Information We Collect',
          items: [
            'Contact details such as name, email address, phone number, billing address, and delivery address.',
            'Order details including products purchased, order value, shipping country, payment status, and order notes.',
            'Bespoke enquiry details such as project type, budget range, description, timeline, and any information you choose to submit.',
            'Technical and usage information such as device, browser, pages visited, analytics events, and cookie preferences where applicable.',
          ],
        },
        {
          title: 'How We Use Information',
          items: [
            'To process orders, arrange delivery, send invoices, and provide customer support.',
            'To respond to contact messages and bespoke commission enquiries.',
            'To improve website performance, product presentation, checkout experience, and business reporting.',
            'To prevent fraud, protect the website, and maintain secure admin and payment operations.',
          ],
        },
        {
          title: 'Payments',
          body: [
            'Payments are handled by third-party payment providers such as POK Albania where enabled. We do not store full card numbers on our servers.',
            'Payment providers may process your data according to their own privacy and security policies.',
          ],
        },
        {
          title: 'Cookies and Analytics',
          body: [
            'We may use cookies and similar technologies to support cart functionality, currency preferences, checkout flow, analytics, and site performance.',
            'Some cookies are necessary for the site to function. Analytics cookies help us understand how visitors use the website and improve the experience.',
          ],
        },
        {
          title: 'Sharing Information',
          body: [
            'We only share personal information where necessary to operate the business, such as with payment processors, delivery partners, email providers, hosting providers, analytics services, or professional advisors.',
            'We do not sell your personal information.',
          ],
        },
        {
          title: 'Retention',
          body: [
            'We keep order and transaction records for as long as needed for customer support, accounting, tax, legal, and business administration purposes.',
            'Enquiry messages may be retained so we can manage client relationships and follow up on projects.',
          ],
        },
        {
          title: 'Your Rights',
          body: [
            'Depending on your location, you may have rights to access, correct, delete, restrict, or object to certain uses of your personal information.',
            'To make a privacy request, contact hello@prela-atelier.com. We may need to verify your identity before completing the request.',
          ],
        },
        {
          title: 'Security',
          body: [
            'We use reasonable technical and organizational measures to protect customer information. No online system can be guaranteed completely secure, but we work to keep data access limited and protected.',
          ],
        },
      ]}
      note="If you use the site on behalf of another person or business, please ensure you have permission to provide their information."
    />
  )
}
