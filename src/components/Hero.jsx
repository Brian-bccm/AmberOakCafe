import { CalendarCheck, ChevronRight, MessageCircle, Star } from 'lucide-react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'
import { highlights } from '../data/siteContent.js'

function Hero() {
  const { business } = useBusinessSettings()

  return (
    <section id="home" className="relative overflow-hidden bg-cafe-ink text-white">
      <div className="absolute inset-0">
        <img
          src={business.heroImageUrl}
          alt="Premium cafe dining space with warm lighting"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cafe-ink via-cafe-ink/75 to-cafe-forest/20" />
      </div>

      <div className="section-shell relative flex min-h-[calc(100svh-280px)] items-center pb-16 pt-12 sm:pb-20 sm:pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <Star size={16} className="fill-cafe-amber text-cafe-amber" aria-hidden="true" />
            {business.heroEyebrow}
          </div>

          <h1 className="mt-6 font-display text-5xl leading-[1.02] text-white sm:mt-7 sm:text-6xl lg:text-7xl">
            {business.heroTitle || business.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-100 sm:mt-6 sm:text-xl">{business.heroCopy || business.tagline}</p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <a
              href="#menu"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-cafe-amber px-6 py-4 text-sm font-bold text-cafe-ink shadow-soft transition hover:bg-amber-300"
            >
              {business.heroPrimaryLabel || 'View Menu'}
              <ChevronRight size={18} aria-hidden="true" />
            </a>
            <a
              href={business.whatsappOrderLink}
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-cafe-ink"
              target="_blank"
              rel="noreferrer"
              aria-label="Order or reserve by WhatsApp"
            >
              <MessageCircle size={18} aria-hidden="true" />
              {business.heroSecondaryLabel || 'Order or Reserve'}
            </a>
          </div>

          <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3 sm:mt-12">
            {highlights.map((item) => (
              <div key={item.label} className="border-l border-white/30 pl-4">
                <p className="font-display text-2xl text-white sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-sm text-stone-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <a
          href="#about"
          className="focus-ring absolute bottom-6 left-5 hidden items-center gap-2 rounded-full text-sm font-semibold text-stone-200 hover:text-white sm:left-6 sm:inline-flex lg:left-8"
        >
          <CalendarCheck size={17} aria-hidden="true" />
          Open today for dine-in and reservations
        </a>
      </div>
    </section>
  )
}

export default Hero
