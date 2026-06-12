import { Gift, MessageCircle } from 'lucide-react'
import { useBusinessSettings } from '../context/useBusinessSettings.js'
import { buildWhatsAppLink } from '../utils/whatsapp.js'

function Promotion() {
  const { business, promotions } = useBusinessSettings()
  const promotion = promotions[0]
  const promoLink = promotion?.whatsapp_message
    ? buildWhatsAppLink(business.phoneRaw, promotion.whatsapp_message.replaceAll('{name}', business.name))
    : business.whatsappPromotionLink

  return (
    <section id="promotion" className="bg-cafe-forest text-white">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur">
          <Gift size={36} className="text-cafe-amber" aria-hidden="true" />
          <p className="mt-5 text-sm uppercase tracking-[0.18em] text-cafe-oat">Special Offer</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">{promotion?.title}</h2>
          <p className="mt-4 text-stone-100">
            {promotion?.description}
          </p>
          <p className="mt-6 font-display text-5xl text-cafe-amber">{promotion?.offer_text}</p>
        </div>

        <div>
          <p className="eyebrow text-cafe-amber">Limited weekly tables</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-white sm:text-5xl">
            Turn promotions into direct reservations with one WhatsApp tap.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-100">
            This section is structured for real client campaigns: seasonal menus, festive bundles, lunch sets, or grand
            opening promotions.
          </p>
          <a
            href={promoLink}
            className="focus-ring mt-8 inline-flex items-center gap-2 rounded-full bg-cafe-amber px-6 py-4 text-sm font-bold text-cafe-ink transition hover:bg-amber-300"
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp to claim the weekend brunch set"
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp to Claim
          </a>
        </div>
      </div>
    </section>
  )
}

export default Promotion
