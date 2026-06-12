import { Coffee, Leaf, Utensils } from 'lucide-react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'

const values = [
  {
    icon: Coffee,
    title: 'Craft coffee bar',
    copy: 'Single-origin espresso, slow bar options, and house signatures balanced for local taste.',
  },
  {
    icon: Utensils,
    title: 'All-day comfort plates',
    copy: 'Cafe classics with Malaysian accents, prepared fresh for brunch, lunch, and early dinner.',
  },
  {
    icon: Leaf,
    title: 'Warm premium setting',
    copy: 'Natural textures, calm service, and a dining room made for casual meetings or weekend treats.',
  },
]

function About() {
  const { business } = useBusinessSettings()

  return (
    <section id="about" className="bg-cafe-cream">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="eyebrow">About</p>
          <h2 className="section-title">{business.aboutTitle}</h2>
          <p className="section-copy">
            {business.aboutCopy}
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {values.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <Icon size={24} className="text-cafe-sage" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-cafe-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative">
          <img
            src={business.aboutImageUrl}
            alt="Amber and wood cafe interior with tables ready for guests"
            className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft"
          />
          <div className="absolute -bottom-6 left-6 max-w-xs rounded-lg bg-cafe-forest p-5 text-white shadow-soft">
            <p className="text-sm uppercase tracking-[0.18em] text-cafe-oat">{business.aboutBadgeTitle}</p>
            <p className="mt-2 font-display text-2xl">{business.aboutBadgeText}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
