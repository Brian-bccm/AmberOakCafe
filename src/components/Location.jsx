import { Clock, MapPin, Navigation } from 'lucide-react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'

function Location() {
  const { business } = useBusinessSettings()

  return (
    <section id="location" className="bg-white">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Location</p>
          <h2 className="section-title">Easy to find in Bangsar, made for dine-in and takeaway.</h2>
          <p className="section-copy">
            Placeholder address and operating hours are realistic for a Kuala Lumpur cafe and can be edited quickly for
            a real small business.
          </p>

          <div className="mt-8 space-y-5">
            <div className="flex gap-4">
              <MapPin className="mt-1 text-cafe-copper" size={22} aria-hidden="true" />
              <div>
                <h3 className="font-bold">Address</h3>
                <p className="mt-1 leading-7 text-stone-600">{business.address}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="mt-1 text-cafe-copper" size={22} aria-hidden="true" />
              <div>
                <h3 className="font-bold">Opening Hours</h3>
                <dl className="mt-2 space-y-2 text-sm text-stone-600">
                  {business.openingHours.map((item) => (
                    <div key={item.day} className="flex flex-wrap justify-between gap-3">
                      <dt>{item.day}</dt>
                      <dd className="font-semibold text-cafe-ink">{item.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <a
            href={business.mapUrl}
            className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-cafe-forest"
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={18} aria-hidden="true" />
            Open in Google Maps
          </a>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-cafe-oat shadow-soft">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,36,33,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(31,36,33,0.08)_1px,transparent_1px)] bg-[size:38px_38px]" />
          <div className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-cafe-sage/40 bg-white p-6 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cafe-sage">Map Preview</p>
            <h3 className="mt-3 font-display text-3xl text-cafe-ink">Bangsar cafe district</h3>
            <p className="mt-3 leading-7 text-stone-600">{business.address}</p>
            <div className="mt-6 h-2 rounded-full bg-cafe-oat">
              <div className="h-2 w-2/3 rounded-full bg-cafe-copper" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-cafe-cream p-4">
                <p className="font-bold">Parking</p>
                <p className="mt-1 text-stone-600">Street and paid lots nearby</p>
              </div>
              <div className="rounded-lg bg-cafe-cream p-4">
                <p className="font-bold">Takeaway</p>
                <p className="mt-1 text-stone-600">Coffee bar pickup ready</p>
              </div>
            </div>
          </div>
          <span className="absolute right-[22%] top-[31%] grid h-12 w-12 place-items-center rounded-full bg-cafe-copper text-white shadow-soft">
            <MapPin size={24} aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  )
}

export default Location
