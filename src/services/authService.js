import { requireSupabase } from '../lib/supabaseClient.js'

export const staffRoles = ['admin', 'manager', 'staff']

export function getUserRole(user) {
  return user?.app_metadata?.role || ''
}

export function isAdminUser(user) {
  return getUserRole(user) === 'admin'
}

export function isStaffUser(user) {
  return staffRoles.includes(getUserRole(user))
}

export function canAccessModule(user, moduleId) {
  const role = getUserRole(user)
  if (role === 'admin') return true
  if (role === 'manager') return !['audit'].includes(moduleId)
  if (role === 'staff') return ['overview', 'reservations', 'orders', 'payments'].includes(moduleId)
  return false
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

  if (!isStaffUser(data.user)) {
    await supabase.auth.signOut()
    throw new Error('This account is not configured as restaurant staff.')
  }

  return data.user
}

export async function signOutAdmin() {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
