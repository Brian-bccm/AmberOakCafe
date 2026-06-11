import { requireSupabase } from '../lib/supabaseClient.js'

export function isAdminUser(user) {
  return user?.app_metadata?.role === 'admin'
}

export async function getSessionUser() {
  const supabase = requireSupabase()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) throw error
  return session?.user || null
}

export async function signInAdmin(email, password) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut()
    throw new Error('This account is not configured as an admin.')
  }

  return data.user
}

export async function signOutAdmin() {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
