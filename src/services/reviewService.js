import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient.js'

const fallbackReviews = [
  {
    id: 'fallback-review-1',
    customer_name: 'Aina Rahman',
    rating: 5,
    comment: 'Warm service, polished brunch plates, and the coffee was excellent.',
    menu_item_name: 'Truffle Mushroom Toast',
    status: 'approved',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fallback-review-2',
    customer_name: 'Daniel Lee',
    rating: 4,
    comment: 'Good spot for client meetings. The menu feels premium but still comfortable.',
    menu_item_name: 'Smoked Duck Benedict',
    status: 'approved',
    created_at: new Date().toISOString(),
  },
]

export async function fetchPublicReviews() {
  if (!isSupabaseConfigured) return fallbackReviews

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.warn('Review fallback used:', error.message)
    return fallbackReviews
  }

  return data?.length ? data : fallbackReviews
}

export async function submitReview(form) {
  if (!isSupabaseConfigured) return { mode: 'demo' }

  const supabase = requireSupabase()
  const payload = {
    customer_name: form.customer_name.trim(),
    rating: Number(form.rating),
    comment: form.comment.trim(),
    menu_item_name: form.menu_item_name?.trim() || null,
    visited_date: form.visited_date || null,
    status: 'pending',
  }
  const { data, error } = await supabase.from('reviews').insert(payload).select().single()
  if (error) throw error
  return { mode: 'supabase', data }
}

export async function fetchAdminReviews() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateReviewStatus(id, status) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteReview(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

export function reviewSummary(reviews) {
  const approved = reviews.filter((review) => review.status === 'approved')
  const average = approved.length ? approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approved.length : 0
  return { average, count: approved.length }
}
