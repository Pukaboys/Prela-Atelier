type PolicySection = {
  title: string
  body?: string[]
  items?: string[]
}

export function PolicyPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  note,
}: {
  eyebrow: string
  title: string
  intro: string
  updated: string
  sections: PolicySection[]
  note?: string
}) {
  return (
    <div>
      <section className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <p className="section-eyebrow" style={{ color: '#b08d57' }}>
            {eyebrow}
          </p>
          <h1 className="font-serif text-6xl md:text-7xl text-stone leading-none mt-4 mb-6">
            {title}
          </h1>
          <p className="font-sans text-stone-mid max-w-2xl text-lg leading-relaxed">
            {intro}
          </p>
          <p className="font-sans text-xs uppercase tracking-widest text-stone-pale mt-8">
            Last updated: {updated}
          </p>
        </div>
      </section>

      <section className="py-24 bg-cream px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
          <aside className="lg:sticky lg:top-32 self-start bg-white border border-beige p-6">
            <p className="section-eyebrow mb-4">On This Page</p>
            <nav className="space-y-3">
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${slugify(section.title)}`}
                  className="block font-sans text-sm text-stone-mid hover:text-gold"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-10">
            {sections.map((section) => (
              <section
                key={section.title}
                id={slugify(section.title)}
                className="bg-white border border-beige p-8"
              >
                <h2 className="font-serif text-3xl text-stone mb-5">
                  {section.title}
                </h2>
                {section.body?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="font-sans text-sm md:text-base text-stone-mid leading-relaxed mb-4 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="space-y-3 mt-5">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 font-sans text-sm md:text-base text-stone-mid leading-relaxed"
                      >
                        <span className="text-gold mt-0.5 flex-shrink-0">+</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {note && (
              <div className="border border-gold/30 bg-gold/5 p-6">
                <p className="font-sans text-sm text-stone-mid leading-relaxed">
                  {note}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
