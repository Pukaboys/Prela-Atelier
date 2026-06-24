import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative corner elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-gold/20 pointer-events-none" />
      <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-gold/20 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-gold/20 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-gold/20 pointer-events-none" />

      <div className="text-center max-w-lg relative z-10">
        {/* Large decorative numeral */}
        <p className="font-serif text-[10rem] md:text-[14rem] leading-none text-cream/5 select-none absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none">
          404
        </p>

        <div className="relative">
          <p className="section-eyebrow mb-0" style={{ color: '#b08d57' }}>Page Not Found</p>

          <h1 className="font-serif text-5xl md:text-6xl text-cream mt-4 mb-6 leading-tight">
            This stone has<br />
            <em className="italic font-light text-gold">moved on.</em>
          </h1>

          <div className="w-12 h-px bg-gold mx-auto my-8" />

          <p className="font-sans text-cream/60 mb-10 leading-relaxed">
            The page you are looking for does not exist or has been moved.<br />
            Let us take you somewhere beautiful.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">
              Return Home
            </Link>
            <Link
              href="/collections"
              className="btn-outline"
              style={{ color: '#faf8f4', borderColor: '#b08d57' }}
            >
              View Collections
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
