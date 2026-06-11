import { MessageCircle } from 'lucide-react'

function WhatsAppButton({ href }) {
  return (
    <a
      href={href}
      className="focus-ring fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-cafe-ink shadow-soft transition hover:-translate-y-1 hover:bg-[#35e476] sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-4"
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp order or reservation"
    >
      <MessageCircle size={23} aria-hidden="true" />
      <span className="hidden text-sm font-bold sm:inline">WhatsApp</span>
    </a>
  )
}

export default WhatsAppButton
