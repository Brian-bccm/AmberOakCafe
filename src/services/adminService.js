import { requireSupabase } from '../lib/supabaseClient.js'
import { normalizePrice } from '../utils/formatters.js'
import { logAuditEvent } from './auditService.js'
import { calculateOrderTotals, totalFromOrder } from './orderTotals.js'

export async function fetchReservations() {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })
  if (error) throw error
  return data || []
}

export async function updateReservationStatus(id, status) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'reservation.status_update', entityType: 'reservation', entityId: id, summary: `Reservation marked ${status}.`, metadata: { status } })
}

export async function deleteReservation(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'reservation.delete', entityType: 'reservation', entityId: id, summary: 'Reservation deleted.' })
}

export async function fetchContactMessages() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateMessageStatus(id, status) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'message.status_update', entityType: 'contact_message', entityId: id, summary: `Message marked ${status}.`, metadata: { status } })
}

export async function deleteContactMessage(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) throw error
}

export async function fetchOrders() {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchPayments() {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateOrderStatus(id, status) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'order.status_update', entityType: 'order', entityId: id, summary: `Order marked ${status}.`, metadata: { status } })
}

export async function updateOrderPaymentStatus(id, paymentStatus) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'order.payment_status_update', entityType: 'order', entityId: id, summary: `Order payment marked ${paymentStatus}.`, metadata: { paymentStatus } })
}

export async function createAdminOrder({ customer, items, notes, settings }) {
  const supabase = requireSupabase()
  const selected = items.filter((item) => Number(item.quantity) > 0)
  const subtotal = selected.reduce((sum, item) => sum + normalizePrice(item.price) * Number(item.quantity), 0)
  const totals = calculateOrderTotals(subtotal, settings)

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email?.trim() || null,
      order_type: customer.order_type || 'pickup',
      status: customer.status || 'pending',
      payment_status: customer.payment_status || 'Pending',
      subtotal: totals.subtotal,
      service_charge_amount: totals.serviceChargeAmount,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const payload = selected.map((item) => ({
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

  await logAuditEvent({ action: 'order.create', entityType: 'order', entityId: order.id, summary: `Created order for ${order.customer_name}.`, metadata: { total: totals.totalAmount } })
  return order
}

export async function createPaymentRecord(payment) {
  const supabase = requireSupabase()
  const payload = {
    order_id: payment.order_id || null,
    customer_name: payment.customer_name.trim(),
    amount: Number(payment.amount || 0),
    payment_method: payment.payment_method || 'Cash',
    payment_status: payment.payment_status || 'Pending',
    transaction_reference: payment.transaction_reference?.trim() || null,
    payment_date: payment.payment_date || new Date().toISOString(),
    notes: payment.notes?.trim() || null,
  }
  const { data, error } = await supabase.from('payment_records').insert(payload).select().single()
  if (error) throw error
  if (payload.order_id) await updateOrderPaymentStatus(payload.order_id, payload.payment_status)
  await logAuditEvent({ action: 'payment.create', entityType: 'payment_record', entityId: data.id, summary: `Created ${payload.payment_status} payment for ${payload.customer_name}.`, metadata: payload })
  return data
}

export async function updatePaymentRecord(id, updates) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('payment_records').update(updates).eq('id', id).select().single()
  if (error) throw error
  if (data?.order_id && updates.payment_status) await updateOrderPaymentStatus(data.order_id, updates.payment_status)
  await logAuditEvent({ action: 'payment.update', entityType: 'payment_record', entityId: id, summary: 'Payment record updated.', metadata: updates })
  return data
}

export async function deletePaymentRecord(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('payment_records').delete().eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'payment.delete', entityType: 'payment_record', entityId: id, summary: 'Payment record deleted.' })
}

export async function confirmCashPaymentForOrder(order) {
  return createPaymentRecord({
    order_id: order.id,
    customer_name: order.customer_name,
    amount: totalFromOrder(order),
    payment_method: 'Cash',
    payment_status: 'Paid',
    transaction_reference: `CASH-${String(order.id).slice(0, 8).toUpperCase()}`,
    payment_date: new Date().toISOString(),
    notes: 'Cash payment confirmed by admin while completing order.',
  })
}

export async function deleteOrder(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'order.delete', entityType: 'order', entityId: id, summary: 'Order deleted.' })
}

export async function fetchAdminDataset() {
  const [reservations, messages, orders, payments] = await Promise.all([fetchReservations(), fetchContactMessages(), fetchOrders(), fetchPayments()])
  return { reservations, messages, orders, payments }
}
