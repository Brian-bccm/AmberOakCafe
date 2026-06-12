import { Instagram, MessageCircle } from 'lucide-react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'
import { navItems } from '../data/siteContent.js'

function Footer() {
  const { business } = useBusinessSettings()

  return (
    <footer className="bg-cafe-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-display text-2xl">{business.name}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">{business.footerText || business.tagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {navItems.slice(0, 4).map((item) => (
            <a key={item.href} href={item.href} className="focus-ring rounded-full px-2 py-1 text-sm text-stone-300 hover:text-white">
              {item.label}
            </a>
          ))}
          <a href="#" className="focus-ring rounded-full p-2 text-stone-300 hover:text-white" aria-label="Instagram">
            <Instagram size={19} aria-hidden="true" />
          </a>
          <a href={business.whatsappLink} className="focus-ring rounded-full p-2 text-stone-300 hover:text-white" aria-label="WhatsApp footer">
            <MessageCircle size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
