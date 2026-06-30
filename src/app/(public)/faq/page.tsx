import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ - Prela Atelier',
  description: 'Answers to common questions about Prela Atelier products, natural stone, shipping, returns, bespoke commissions, and payments.',
}

const FAQS = [
  {
    category: 'Products',
    questions: [
      {
        question: 'Are all pieces made from real natural stone?',
        answer: 'Yes. Prela Atelier pieces are made from natural stone such as marble, travertine, onyx, and related materials. We do not present resin or composite materials as natural stone.',
      },
      {
        question: 'Will my piece look exactly like the photos?',
        answer: 'No two natural stone pieces are identical. Veining, tone, pores, and mineral marks vary naturally. Product images represent the design and material family, but each finished piece is unique.',
      },
      {
        question: 'Do products include a certificate?',
        answer: 'Where applicable, orders include stone documentation or a certificate of authenticity. The product page or order confirmation will indicate what is included.',
      },
    ],
  },
  {
    category: 'Orders and Payment',
    questions: [
      {
        question: 'Which currencies do you support?',
        answer: 'Prices are stored and processed in EUR. The site can display EUR, USD, or GBP for convenience, using the conversion settings configured by Prela Atelier.',
      },
      {
        question: 'Which payment methods are available?',
        answer: 'Checkout supports Visa and Mastercard card payments through the approved official card-payment gateway where available, plus bank transfer as a manual fallback. Prela Atelier does not store full card numbers on its servers.',
      },
      {
        question: 'Can I download an invoice?',
        answer: 'Yes. Customer invoice links are included in order emails and order confirmation pages where available. Admin users can also view and download invoices from the order management area.',
      },
    ],
  },
  {
    category: 'Shipping and Returns',
    questions: [
      {
        question: 'Where do you ship?',
        answer: 'We ship from Albania to Albania, Europe, and selected international destinations. If your destination is not available at checkout, contact us before ordering.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Ready-made pieces are normally prepared within 2 to 5 business days after payment confirmation. Delivery time after dispatch depends on the courier and destination.',
      },
      {
        question: 'Can I return an item?',
        answer: 'Eligible ready-made items may be returned within 14 days if unused, undamaged, and in original packaging. Bespoke and personalized pieces are generally not returnable unless faulty or incorrect.',
      },
      {
        question: 'What if my order arrives damaged?',
        answer: 'Contact us within 48 hours of delivery with your order reference and clear photos of the item and packaging. Keep all packaging while the case is reviewed.',
      },
    ],
  },
  {
    category: 'Bespoke Commissions',
    questions: [
      {
        question: 'Do you make custom pieces?',
        answer: 'Yes. We accept bespoke enquiries for trays, bowls, vessels, sculptural objects, furniture components, architectural details, and special projects.',
      },
      {
        question: 'How long does a bespoke commission take?',
        answer: 'Most bespoke pieces require 4 to 8 weeks after approval, depending on complexity, material availability, and delivery destination.',
      },
      {
        question: 'Can I send dimensions or reference images?',
        answer: 'Yes. Share dimensions, intended use, material preference, budget, and references through the bespoke enquiry form. File upload support is planned as part of the next business-platform upgrade.',
      },
    ],
  },
  {
    category: 'Care',
    questions: [
      {
        question: 'How should I clean marble?',
        answer: 'Use a soft cloth, warm water, and pH-neutral stone cleaner. Avoid vinegar, lemon juice, bleach, abrasive powders, and acidic products.',
      },
      {
        question: 'Does natural stone need sealing?',
        answer: 'Many stones benefit from periodic sealing, especially porous materials such as travertine and limestone. See our care guide for more detailed advice.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>
            Customer Support
          </p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="font-sans text-stone-mid max-w-2xl text-lg leading-relaxed">
            Answers to common questions about natural stone, orders, shipping,
            returns, payments, and bespoke commissions.
          </p>
        </div>
      </section>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {FAQS.map((group) => (
            <section key={group.category}>
              <p className="section-eyebrow">{group.category}</p>
              <div className="space-y-4">
                {group.questions.map((item) => (
                  <details
                    key={item.question}
                    className="group bg-white border border-beige p-6 open:border-gold/50"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-6">
                      <span className="font-serif text-xl text-stone">
                        {item.question}
                      </span>
                      <span className="text-gold text-xl transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="font-sans text-sm md:text-base text-stone-mid leading-relaxed mt-4 pr-8">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="bg-stone text-cream p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="section-eyebrow" style={{ color: '#b08d57' }}>
                Still Need Help?
              </p>
              <h2 className="font-serif text-3xl text-cream">
                We will be glad to assist.
              </h2>
            </div>
            <Link href="/contact" className="btn-primary text-center">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
