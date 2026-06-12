import { cafe, galleryImages, openingHours } from '../data/siteContent.js'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient.js'
import { buildWhatsAppLink } from '../utils/whatsapp.js'

const defaultOpeningHoursText = openingHours.map((item) => `${item.day}: ${item.time}`).join('\n')

export const defaultBusinessSettings = {
  name: cafe.name,
  brandLabel: 'Premium cafe',
  tagline: cafe.tagline,
  shortDescription: 'A warm, premium cafe website and operations template for real restaurant clients.',
  aboutTitle: 'A neighborhood cafe designed for slow mornings and polished casual dining.',
  aboutCopy:
    'Amber & Oak Cafe is a premium but approachable dining spot built for small celebrations, client catch-ups, and everyday coffee rituals. The menu keeps familiar brunch favorites while adding local flavors that work well for Kuala Lumpur customers.',
  aboutImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1100&q=80',
  aboutBadgeTitle: 'Since 2022',
  aboutBadgeText: 'Built for great coffee, honest plates, and repeat customers.',
  heroEyebrow: 'Bangsar all-day brunch and coffee bar',
  heroTitle: cafe.name,
  heroCopy: cafe.tagline,
  heroImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80',
  heroPrimaryLabel: 'View Menu',
  heroSecondaryLabel: 'Order or Reserve',
  phoneDisplay: cafe.phoneDisplay,
  phoneRaw: cafe.phoneRaw,
  email: cafe.email,
  address: cafe.address,
  mapUrl: cafe.mapUrl,
  openingHoursText: defaultOpeningHoursText,
  footerText: cafe.tagline,
  seoTitle: 'Amber & Oak Cafe | Brunch, Coffee, Reservations & Orders',
  seoDescription: 'Modern restaurant website with menu, orders, reservations, WhatsApp enquiries, admin dashboard, payments, and reports.',
  reservationWhatsAppMessage: 'Hi {name}, I would like to make a reservation.',
  orderWhatsAppMessage: 'Hi {name}, I would like to place an order.',
  contactWhatsAppMessage: 'Hi {name}, I have a general enquiry.',
  promotionWhatsAppMessage: 'Hi {name}, I would like to claim the current promotion.',
  paymentInstructionsEnabled: true,
  paymentInstructions:
    'Payment can be made by cash, card, online transfer, TNG eWallet, GrabPay, or DuitNow QR. Please send the receipt/reference number after payment.',
  paymentQrImageUrl: '',
  paymentEnabledMethods: 'Cash, Credit/Debit Card, Online Bank Transfer, TNG eWallet, GrabPay, DuitNow QR',
  provider: 'manual',
  providerMode: 'manual',
  providerPublicLabel: 'Manual payment tracking',
}

export const defaultGalleryItems = galleryImages.map((image, index) => ({
  id: `fallback-gallery-${index}`,
  title: index === 0 ? 'Coffee bar' : index === 1 ? 'Cafe interior' : index === 2 ? 'Brunch plates' : 'Kitchen craft',
  image_url: image.src,
  alt_text: image.alt,
  display_order: index + 1,
  is_published: true,
}))

export const defaultPromotions = [
  {
    id: 'fallback-promotion-1',
    title: 'Weekend Brunch Set',
    description: 'Any brunch main, dessert slice, and signature iced latte for two guests.',
    offer_text: 'RM 88',
    image_url: '',
    whatsapp_message: 'Hi {name}, I would like to claim the Weekend Brunch Set promotion.',
    is_active: true,
    display_order: 1,
  },
]

function interpolateMessage(message, settings) {
  return String(message || '').replaceAll('{name}', settings.name || defaultBusinessSettings.name)
}

export function parseOpeningHours(text) {
  return String(text || defaultOpeningHoursText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [day, ...timeParts] = line.split(':')
      return {
        day: day.trim(),
        time: timeParts.join(':').trim() || 'Open',
      }
    })
    .filter((item) => item.day)
}

export function buildBusinessSettings(settings = {}) {
  const merged = { ...defaultBusinessSettings, ...(settings || {}) }
  merged.openingHours = parseOpeningHours(merged.openingHoursText)
  merged.whatsappLink = buildWhatsAppLink(merged.phoneRaw, interpolateMessage(merged.reservationWhatsAppMessage, merged))
  merged.whatsappOrderLink = buildWhatsAppLink(merged.phoneRaw, interpolateMessage(merged.orderWhatsAppMessage, merged))
  merged.whatsappContactLink = buildWhatsAppLink(merged.phoneRaw, interpolateMessage(merged.contactWhatsAppMessage, merged))
  merged.whatsappPromotionLink = buildWhatsAppLink(merged.phoneRaw, interpolateMessage(merged.promotionWhatsAppMessage, merged))
  return merged
}

function normalizeSettingsRow(row) {
  return buildBusinessSettings(row?.settings || row || {})
}

export async function fetchBusinessSettings() {
  if (!isSupabaseConfigured) return buildBusinessSettings()

  const supabase = requireSupabase()
  const { data, error } = await supabase.from('business_settings').select('settings').eq('id', 'default').maybeSingle()

  if (error) {
    console.warn('Business settings fallback used:', error.message)
    return buildBusinessSettings()
  }

  return normalizeSettingsRow(data)
}

export async function saveBusinessSettings(settings) {
  const supabase = requireSupabase()
  const payload = { id: 'default', settings: { ...defaultBusinessSettings, ...settings }, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('business_settings').upsert(payload).select().single()
  if (error) throw error
  return normalizeSettingsRow(data)
}

export async function fetchPublicGalleryItems() {
  if (!isSupabaseConfigured) return defaultGalleryItems

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('Gallery fallback used:', error.message)
    return defaultGalleryItems
  }

  return data?.length ? data : defaultGalleryItems
}

export async function fetchAdminGalleryItems() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('gallery_items').select('*').order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createGalleryItem(item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('gallery_items').insert(toGalleryPayload(item)).select().single()
  if (error) throw error
  return data
}

export async function updateGalleryItem(id, item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('gallery_items').update(toGalleryPayload(item)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGalleryItem(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPublicPromotions() {
  if (!isSupabaseConfigured) return defaultPromotions

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.warn('Promotion fallback used:', error.message)
    return defaultPromotions
  }

  return data?.length ? data : defaultPromotions
}

export async function fetchAdminPromotions() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('promotions').select('*').order('display_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createPromotion(item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('promotions').insert(toPromotionPayload(item)).select().single()
  if (error) throw error
  return data
}

export async function updatePromotion(id, item) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('promotions').update(toPromotionPayload(item)).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePromotion(id) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('promotions').delete().eq('id', id)
  if (error) throw error
}

export async function uploadRestaurantAsset(file, folder = 'uploads') {
  if (!file) throw new Error('Choose an image file first.')

  const supabase = requireSupabase()
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  const path = `${folder}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('restaurant-assets').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(path)
  return data.publicUrl
}

function toGalleryPayload(item) {
  return {
    title: item.title?.trim() || 'Gallery image',
    image_url: item.image_url?.trim(),
    alt_text: item.alt_text?.trim() || item.title?.trim() || 'Restaurant gallery image',
    display_order: Number(item.display_order || 0),
    is_published: Boolean(item.is_published),
  }
}

function toPromotionPayload(item) {
  return {
    title: item.title?.trim() || 'Special offer',
    description: item.description?.trim() || '',
    offer_text: item.offer_text?.trim() || '',
    image_url: item.image_url?.trim() || null,
    whatsapp_message: item.whatsapp_message?.trim() || defaultBusinessSettings.promotionWhatsAppMessage,
    display_order: Number(item.display_order || 0),
    is_active: Boolean(item.is_active),
  }
}
