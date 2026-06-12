import { ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublicMenuItems, fallbackMenu } from '../services/menuService.js'
import { submitOrder } from '../services/customerService.js'
import { formatCurrency, normalizePrice } from '../utils/formatters.js'

const initialCustomer = { name: '', phone: '', email: '', order_type: 'pickup' }

function Order() {
  const [items, setItems] = useState(fallbackMenu().slice(0, 4).map((item) => ({ ...item, quantity: 0, notes: '', customizations: {} })))
  const [customer, setCustomer] = useState(initialCustomer)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    fetchPublicMenuItems().then((result) => {
      if (!ignore) setItems(result.data.slice(0, 6).map((item) => ({ ...item, quantity: 0, notes: '', customizations: {} })))
    })
    return () => {
      ignore = true
    }
  }, [])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + normalizePrice(item.price) * Number(item.quantity || 0), 0),
    [items],
  )

  const updateQuantity = (id, quantity) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const updateItemNotes = (id, itemNotes) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, notes: itemNotes } : item)))
  }

  const updateCustomization = (id, optionName, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              customizations: {
                ...(item.customizations || {}),
                [optionName]: value,
              },
            }
          : item,
      ),
    )
  }

  const handleCustomerChange = (event) => {
    const { name, value } = event.target
    setCustomer((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    const selected = items.filter((item) => Number(item.quantity) > 0)

    if (!customer.name.trim() || !customer.phone.trim() || selected.length === 0) {
      setStatus({ type: 'error', message: 'Please add name, phone, and at least one menu item.' })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitOrder({ customer, items: selected, notes })
      setStatus({
        type: 'success',
        message:
          result.mode === 'demo'
            ? 'Demo order captured locally. Connect Supabase to save orders.'
            : 'Order saved. The admin dashboard can now track it.',
      })
      setCustomer(initialCustomer)
      setNotes('')
      setItems((current) => current.map((item) => ({ ...item, quantity: 0, notes: '', customizations: {} })))
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Order could not be saved.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="order" className="bg-white">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Order Enquiry</p>
            <h2 className="section-title">A lightweight order flow for small food businesses.</h2>
          </div>
          <p className="max-w-md text-base leading-7 text-stone-600">
            Customers can request pickup orders without turning the landing page into a heavy ecommerce store.
          </p>
        </div>

        <form className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="rounded-lg border border-stone-200 bg-cafe-cream p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(item.price)}</p>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-bold">
                  Quantity
                  <input type="number" min="0" max="20" value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-2 font-normal" />
                </label>
                {(item.customization_options || []).map((option) => (
                  <label key={`${item.id}-${option.name}`} className="mt-4 grid gap-2 text-sm font-bold">
                    {option.name}
                    <select value={item.customizations?.[option.name] || option.choices?.[0] || ''} onChange={(event) => updateCustomization(item.id, option.name, event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-2 font-normal">
                      {(option.choices || []).map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="mt-4 grid gap-2 text-sm font-bold">
                  Description / special request
                  <textarea value={item.notes || ''} onChange={(event) => updateItemNotes(item.id, event.target.value)} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-white px-4 py-2 font-normal" placeholder="Example: less spicy, no onion, extra sauce" />
                </label>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-stone-200 bg-cafe-cream p-6 shadow-soft">
            <ShoppingBag size={28} className="text-cafe-copper" aria-hidden="true" />
            <h3 className="mt-4 font-display text-2xl">Order details</h3>
            <div className="mt-5 grid gap-4">
              <input name="name" value={customer.name} onChange={handleCustomerChange} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-3" placeholder="Customer name" />
              <input name="phone" value={customer.phone} onChange={handleCustomerChange} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-3" placeholder="Phone number" />
              <input name="email" type="email" value={customer.email} onChange={handleCustomerChange} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-3" placeholder="Email optional" />
              <select name="order_type" value={customer.order_type} onChange={handleCustomerChange} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-3">
                <option value="pickup">Pickup</option>
                <option value="dine-in">Dine-in request</option>
                <option value="delivery">Delivery enquiry</option>
              </select>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-white px-4 py-3" placeholder="Order notes" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-5">
              <span className="font-bold">Subtotal</span>
              <span className="font-display text-3xl">{formatCurrency(subtotal)}</span>
            </div>
            <button type="submit" disabled={isSubmitting} className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white transition hover:bg-cafe-forest disabled:opacity-60">
              {isSubmitting ? 'Saving...' : 'Send Order Request'}
            </button>
            <div aria-live="polite" className={`mt-4 rounded-lg px-4 py-3 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-800' : status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-stone-600'}`}>
              {status.message || 'The restaurant confirms final availability and timing after receiving the request.'}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Order
