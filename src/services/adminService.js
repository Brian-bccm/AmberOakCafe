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

export async function deleteOrder(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

export async function fetchAdminDataset() {
  const [reservations, messages, orders] = await Promise.all([fetchReservations(), fetchContactMessages(), fetchOrders()])
  return { reservations, messages, orders }
}
