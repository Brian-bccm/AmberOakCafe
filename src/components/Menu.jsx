import { BadgeCheck } from 'lucide-react'
import { menuItems } from '../data/siteContent.js'

function Menu() {
  return (
    <section id="menu" className="bg-white">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Signature Menu</p>
            <h2 className="section-title">Cafe plates that photograph well and sell easily.</h2>
          </div>
          <p className="max-w-md text-base leading-7 text-stone-600">
            Prices are realistic placeholders for a Bangsar-style premium cafe and can be swapped for any real client
            menu.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {menuItems.map((item) => (
            <article key={item.name} className="rounded-lg border border-stone-200 bg-cafe-cream p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cafe-sage">
                    <BadgeCheck size={14} aria-hidden="true" />
                    {item.tag}
                  </span>
                  <h3 className="mt-4 font-display text-2xl text-cafe-ink">{item.name}</h3>
                </div>
                <p className="rounded-full bg-cafe-ink px-4 py-2 text-sm font-bold text-white">{item.price}</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Menu
