import { CalendarCheck, MessageCircle, Users } from 'lucide-react'
import { useState } from 'react'
import { cafe } from '../data/siteContent.js'
import { submitReservation } from '../services/customerService.js'

const initialForm = {
  customer_name: '',
  phone: '',
  email: '',
  reservation_date: '',
  reservation_time: '',
  guests: 2,
  notes: '',
}

function Reservation() {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!form.customer_name.trim() || !form.phone.trim() || !form.reservation_date || !form.reservation_time) {
      setStatus({ type: 'error', message: 'Please add your name, phone, date, and time before reserving.' })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitReservation(form)
      setStatus({
        type: 'success',
        message:
          result.mode === 'demo'
            ? 'Demo reservation captured locally. Connect Supabase to save it in the database.'
            : 'Reservation saved. The cafe team can now manage it in the admin dashboard.',
      })
      setForm(initialForm)
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Reservation could not be saved. Please try WhatsApp.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="reservation" className="bg-cafe-oat/70">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="eyebrow">Reservations</p>
          <h2 className="section-title">Let customers request a table without calling first.</h2>
          <p className="section-copy">
            Reservation requests are saved to Supabase when configured, then managed inside the admin dashboard.
          </p>
          <div className="mt-8 grid gap-4">
            <div className="flex gap-4 rounded-lg bg-white p-5 shadow-sm">
              <CalendarCheck className="mt-1 text-cafe-copper" size={24} aria-hidden="true" />
              <div>
                <h3 className="font-bold">Structured booking details</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">Date, time, guest count, phone, and notes are captured in one place.</p>
              </div>
            </div>
            <a
              href={cafe.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-bold text-cafe-ink shadow-soft transition hover:bg-[#35e476]"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Reserve by WhatsApp
            </a>
          </div>
        </div>

        <form
          aria-label="Reservation form"
          className="rounded-lg border border-stone-200 bg-white p-6 shadow-soft sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Name
              <input name="customer_name" value={form.customer_name} onChange={handleChange} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" placeholder="Your name" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Phone
              <input name="phone" value={form.phone} onChange={handleChange} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" placeholder="012-345 6789" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Date
              <input name="reservation_date" type="date" value={form.reservation_date} onChange={handleChange} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Time
              <input name="reservation_time" type="time" value={form.reservation_time} onChange={handleChange} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Guests
              <span className="relative">
                <Users className="pointer-events-none absolute left-4 top-3.5 text-stone-500" size={18} aria-hidden="true" />
                <input name="guests" type="number" min="1" max="30" value={form.guests} onChange={handleChange} className="focus-ring w-full rounded-lg border border-stone-300 bg-cafe-cream py-3 pl-11 pr-4 font-normal" />
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold text-cafe-ink">
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" placeholder="Optional" />
            </label>
          </div>

          <label className="mt-5 grid gap-2 text-sm font-bold text-cafe-ink">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" placeholder="Birthday, baby chair, window table, or allergy notes." />
          </label>

          <button type="submit" disabled={isSubmitting} className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-cafe-forest disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <CalendarCheck size={18} aria-hidden="true" />
            {isSubmitting ? 'Saving...' : 'Request Reservation'}
          </button>

          <div aria-live="polite" className={`mt-5 rounded-lg px-4 py-3 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-800' : status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-cafe-cream text-stone-600'}`}>
            {status.message || 'For urgent same-day bookings, WhatsApp is still the fastest option.'}
          </div>
        </form>
      </div>
    </section>
  )
}

export default Reservation
