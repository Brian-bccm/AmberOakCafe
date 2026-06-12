import { menuItems as fallbackMenuItems } from '../data/siteContent.js'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient.js'
import { normalizePrice } from '../utils/formatters.js'
import { logAuditEvent } from './auditService.js'

function toDbMenuItem(item) {
  return {
    name: item.name.trim(),
    description: item.description.trim(),
    price: normalizePrice(item.price),
    category: item.category?.trim() || 'Brunch',
    tag: item.tag?.trim() || 'Signature',
    image_url: item.image_url?.trim() || null,
    customization_options: parseCustomizationOptions(item.customization_options),
    is_available: Boolean(item.is_available),
    display_order: Number(item.display_order || 0),
  }
}

export function parseCustomizationOptions(value) {
  if (Array.isArray(value)) return value.filter((option) => option?.name)
  if (!value?.trim?.()) return []

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, rawChoices] = line.split(':')
      return {
        name: name.trim(),
        choices: (rawChoices || 'No,Yes')
          .split(',')
          .map((choice) => choice.trim())
          .filter(Boolean),
      }
    })
    .filter((option) => option.name && option.choices.length)
}

export function stringifyCustomizationOptions(value) {
  if (!Array.isArray(value) || !value.length) return ''
  return value.map((option) => `${option.name}: ${(option.choices || []).join(', ')}`).join('\n')
}

export function fallbackMenu() {
  return fallbackMenuItems.map((item, index) => ({
    id: `fallback-${index}`,
    name: item.name,
    description: item.description,
    price: normalizePrice(item.price),
    category: item.category || item.tag || 'Menu',
    tag: item.tag,
    image_url: item.image_url || null,
    customization_options: item.customization_options || [],
    is_available: true,
    display_order: index + 1,
  }))
}

export async function fetchPublicMenuItems() {
  if (!isSupabaseConfigured) {
    return { data: fallbackMenu(), source: 'fallback' }
  }

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.warn('Menu fallback used because Supabase menu fetch failed:', error.message)
    return { data: fallbackMenu(), source: 'fallback', error }
  }

  return { data: data?.length ? data : fallbackMenu(), source: data?.length ? 'supabase' : 'fallback' }
}

export async function fetchAdminMenuItems() {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createMenuItem(item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('menu_items').insert(toDbMenuItem(item)).select().single()
  if (error) throw error
  await logAuditEvent({ action: 'menu.create', entityType: 'menu_item', entityId: data.id, summary: `Created menu item ${data.name}.`, metadata: { name: data.name } })
  return data
}

export async function updateMenuItem(id, item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('menu_items').update(toDbMenuItem(item)).eq('id', id).select().single()
  if (error) throw error
  await logAuditEvent({ action: 'menu.update', entityType: 'menu_item', entityId: id, summary: `Updated menu item ${data.name}.`, metadata: { name: data.name } })
  return data
}

export async function deleteMenuItem(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
  await logAuditEvent({ action: 'menu.delete', entityType: 'menu_item', entityId: id, summary: 'Deleted menu item.' })
}
