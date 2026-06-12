import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient.js'
import { normalizePrice } from '../utils/formatters.js'
import { fetchBusinessSettings } from './contentService.js'
import { calculateOrderTotals } from './orderTotals.js'

export async function submitContactMessage(form) {
  if (!isSupabaseConfigured) {
    return { mode: 'demo' }
  }

  const supabase = requireSupabase()
  const payload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || null,
    message: form.message.trim(),
  }

  const { data, error } = await supabase.from('contact_messages').insert(payload).select().single()
  if (error) throw error
  return { mode: 'supabase', data }
}

export async function submitReservation(form) {
  if (!isSupabaseConfigured) {
    return { mode: 'demo' }
  }

  const supabase = requireSupabase()
  const payload = {
    customer_name: form.customer_name.trim(),
    phone: form.phone.trim(),
    email: form.email?.trim() || null,
    reservation_date: form.reservation_date,
    reservation_time: form.reservation_time,
    guests: Number(form.guests),
    notes: form.notes?.trim() || null,
  }

  const { data, error } = await supabase.from('reservations').insert(payload).select().single()
  if (error) throw error
  return { mode: 'supabase', data }
}

export async function submitOrder({ customer, items, notes }) {
  if (!isSupabaseConfigured) {
    return { mode: 'demo' }
  }

  const supabase = requireSupabase()
  const orderItems = items.filter((item) => Number(item.quantity) > 0)
  const subtotal = orderItems.reduce((sum, item) => sum + normalizePrice(item.price) * Number(item.quantity), 0)
  const settings = await fetchBusinessSettings()
  const totals = calculateOrderTotals(subtotal, settings)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email?.trim() || null,
      order_type: customer.order_type || 'pickup',
      subtotal: totals.subtotal,
      service_charge_amount: totals.serviceChargeAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const payload = orderItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id?.startsWith?.('fallback-') ? null : item.id,
    item_name: item.name,
    unit_price: normalizePrice(item.price),
    quantity: Number(item.quantity),
    customizations: item.customizations || {},
    notes: item.notes?.trim() || null,
  }))

  const { error: itemError } = await supabase.from('order_items').insert(payload)
  if (itemError) throw itemError

  return { mode: 'supabase', data: order }
}
