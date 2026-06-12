import { requireSupabase } from '../lib/supabaseClient.js'

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
}

export async function deleteReservation(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) throw error
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
}

export async function updateOrderPaymentStatus(id, paymentStatus) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', id)
  if (error) throw error
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
  return data
}

export async function updatePaymentRecord(id, updates) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('payment_records').update(updates).eq('id', id).select().single()
  if (error) throw error
  if (data?.order_id && updates.payment_status) await updateOrderPaymentStatus(data.order_id, updates.payment_status)
  return data
}

export async function deletePaymentRecord(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('payment_records').delete().eq('id', id)
  if (error) throw error
}

export async function confirmCashPaymentForOrder(order) {
  return createPaymentRecord({
    order_id: order.id,
    customer_name: order.customer_name,
    amount: order.subtotal,
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
}

export async function fetchAdminDataset() {
  const [reservations, messages, orders, payments] = await Promise.all([fetchReservations(), fetchContactMessages(), fetchOrders(), fetchPayments()])
  return { reservations, messages, orders, payments }
}
