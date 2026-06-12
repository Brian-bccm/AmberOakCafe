import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient.js'
import { getSessionUser, getUserRole } from './authService.js'

export async function logAuditEvent({ action, entityType, entityId = null, summary = '', metadata = {} }) {
  if (!isSupabaseConfigured) return null

  try {
    const supabase = requireSupabase()
    const user = await getSessionUser()
    const payload = {
      actor_id: user?.id || null,
      actor_email: user?.email || 'unknown',
      actor_role: getUserRole(user) || 'unknown',
      action,
      entity_type: entityType,
      entity_id: entityId,
      summary,
      metadata,
    }
    const { data, error } = await supabase.from('audit_logs').insert(payload).select().single()
    if (error) throw error
    return data
  } catch (error) {
    console.warn('Audit log was not saved:', error.message)
    return null
  }
}

export async function fetchAuditLogs() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
