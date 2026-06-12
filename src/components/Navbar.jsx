import { Menu, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'
import { navItems } from '../data/siteContent.js'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { business } = useBusinessSettings()

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-cafe-cream/90 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8"
      >
        <a href="#home" className="focus-ring flex items-center gap-3 rounded-full" onClick={closeMenu}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-cafe-ink text-sm font-bold text-cafe-cream">
            A&O
          </span>
          <span>
            <span className="block font-display text-xl leading-none">{business.name}</span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-stone-500 sm:block">{business.brandLabel}</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="focus-ring rounded-full text-sm font-semibold text-stone-700 transition hover:text-cafe-copper"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={business.whatsappLink}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-cafe-forest px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-cafe-ink"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp reservation"
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-cafe-ink lg:hidden"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-stone-200 bg-cafe-cream px-5 py-5 shadow-soft lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="focus-ring rounded-lg px-3 py-3 text-base font-semibold text-stone-800 hover:bg-white"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
          </div>
          <a
            href={business.whatsappLink}
            className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cafe-forest px-5 py-3 text-sm font-bold text-white"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp reservation mobile"
            onClick={closeMenu}
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      ) : null}
    </header>
  )
}

export default Navbar
