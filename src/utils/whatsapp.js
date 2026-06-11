export function buildWhatsAppLink(phoneRaw, message) {
  const cleanedPhone = String(phoneRaw || '').replace(/[^\d]/g, '')
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`
}

export function reservationMessage(cafeName) {
  return `Hi ${cafeName}, I would like to make a reservation.`
}

export function orderMessage(cafeName, itemName = '') {
  const suffix = itemName ? ` for ${itemName}` : ''
  return `Hi ${cafeName}, I would like to place an order${suffix}.`
}

export function promotionMessage(cafeName) {
  return `Hi ${cafeName}, I would like to claim the Weekend Brunch Set promotion.`
}
