import type { Metadata } from 'next'
import { getSettings } from '@/lib/settings'
import { ContactForm } from '@/components/contact/ContactForm'

export const metadata: Metadata = { title: 'Contact — Prela Atelier' }
export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const settings = await getSettings()

  const contactInfo = {
    email: settings.contact_email,
    whatsapp: settings.contact_whatsapp,
    whatsappDisplay: settings.contact_whatsapp_display,
    studio: settings.contact_studio,
    hoursDays: settings.contact_hours_days,
    hoursTime: settings.contact_hours_time,
    responseDays: settings.response_days,
  }

  return (
    <div>
      {/* Page hero */}
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>Get in Touch</p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            Contact
          </h1>
          <p className="font-sans text-stone-mid max-w-xl text-lg leading-relaxed">
            We would be glad to hear from you — whether it is a product question, a bespoke enquiry, or simply a hello.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-cream px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Contact info */}
          <div>
            <p className="section-eyebrow">Contact Details</p>
            <h2 className="section-title">Reach Us</h2>
            <div className="divider-gold mb-8" />

            <div className="space-y-8">
              {/* Email */}
              <div className="flex items-start gap-4">
                <span className="text-gold text-xl mt-0.5">✉</span>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-1">Email</p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="font-serif text-xl text-stone hover:text-gold transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-4">
                <span className="text-gold text-xl mt-0.5">◈</span>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-1">WhatsApp</p>
                  <a
                    href={`https://wa.me/${contactInfo.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-xl text-stone hover:text-gold transition-colors"
                  >
                    {contactInfo.whatsappDisplay}
                  </a>
                </div>
              </div>

              {/* Studio */}
              <div className="flex items-start gap-4">
                <span className="text-gold text-xl mt-0.5">◆</span>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-1">Studio</p>
                  <p className="font-serif text-xl text-stone">{contactInfo.studio}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <span className="text-gold text-xl mt-0.5">○</span>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mb-1">Hours</p>
                  <p className="font-serif text-xl text-stone">{contactInfo.hoursDays}</p>
                  <p className="font-sans text-sm text-stone-mid mt-0.5">{contactInfo.hoursTime}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 border border-beige bg-white">
              <p className="font-sans text-sm text-stone-mid leading-relaxed">
                For bespoke commissions and larger projects, please use our{' '}
                <a href="/bespoke" className="text-gold hover:underline">dedicated bespoke enquiry form</a>{' '}
                to ensure we capture all the necessary details for your project.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <ContactForm responseDays={contactInfo.responseDays} />
        </div>
      </section>
    </div>
  )
}
