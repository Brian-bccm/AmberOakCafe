import { Mail, Phone, Send } from 'lucide-react'
import { useState } from 'react'
import { cafe } from '../data/siteContent.js'

const initialForm = {
  name: '',
  phone: '',
  message: '',
}

function encodeForm(formData) {
  return new URLSearchParams(formData).toString()
}

function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setStatus({
        type: 'error',
        message: 'Please complete your name, phone, and message before sending.',
      })
      return
    }

    const formData = new FormData(event.currentTarget)
    const hostname = window.location.hostname

    if (hostname && !['localhost', '127.0.0.1'].includes(hostname)) {
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForm(formData),
      }).catch(() => {})
    }

    setStatus({
      type: 'success',
      message: `Thanks, ${form.name.split(' ')[0]}. Your enquiry is ready and the cafe team will reply soon.`,
    })
    setForm(initialForm)
  }

  return (
    <section id="contact" className="bg-cafe-cream">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h2 className="section-title">Send an enquiry or reserve through WhatsApp.</h2>
          <p className="section-copy">
            The form is configured for Netlify Forms on deployment, while WhatsApp gives customers a fast direct action.
          </p>

          <div className="mt-8 grid gap-4">
            <a
              href={`tel:${cafe.phoneRaw}`}
              className="focus-ring flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-cafe-sage"
            >
              <Phone size={22} className="text-cafe-sage" aria-hidden="true" />
              <span>
                <span className="block text-sm text-stone-500">Phone</span>
                <span className="font-bold">{cafe.phoneDisplay}</span>
              </span>
            </a>
            <a
              href={`mailto:${cafe.email}`}
              className="focus-ring flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-cafe-sage"
            >
              <Mail size={22} className="text-cafe-sage" aria-hidden="true" />
              <span>
                <span className="block text-sm text-stone-500">Email</span>
                <span className="font-bold">{cafe.email}</span>
              </span>
            </a>
          </div>
        </div>

        <form
          name="contact"
          method="POST"
          data-netlify="true"
          data-netlify-honeypot="bot-field"
          aria-label="Contact form"
          className="rounded-lg border border-stone-200 bg-white p-6 shadow-soft sm:p-8"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="form-name" value="contact" />
          <p className="hidden">
            <label>
              Do not fill this out: <input name="bot-field" tabIndex="-1" autoComplete="off" />
            </label>
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal text-cafe-ink"
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal text-cafe-ink"
                placeholder="012-345 6789"
                autoComplete="tel"
              />
            </label>
          </div>

          <label className="mt-5 grid gap-2 text-sm font-bold text-cafe-ink">
            Message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="focus-ring min-h-36 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal text-cafe-ink"
              placeholder="Tell us your date, time, guests, or order request."
            />
          </label>

          <button
            type="submit"
            className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-cafe-forest sm:w-auto"
          >
            <Send size={18} aria-hidden="true" />
            Send Enquiry
          </button>

          <div
            aria-live="polite"
            className={`mt-5 rounded-lg px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'bg-red-50 text-red-800'
                : status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-cafe-cream text-stone-600'
            }`}
          >
            {status.message || 'For urgent same-day reservations, WhatsApp is the fastest option.'}
          </div>
        </form>
      </div>
    </section>
  )
}

export default Contact
