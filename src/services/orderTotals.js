import { normalizePrice } from '../utils/formatters.js'

export function calculateOrderTotals(subtotal, settings = {}) {
  const base = normalizePrice(subtotal)
  const serviceChargePercent = Number(settings.serviceChargePercent || 0)
  const taxPercent = Number(settings.taxPercent || 0)
  const serviceChargeAmount = Number((base * serviceChargePercent / 100).toFixed(2))
  const taxAmount = Number(((base + serviceChargeAmount) * taxPercent / 100).toFixed(2))
  const totalAmount = Number((base + serviceChargeAmount + taxAmount).toFixed(2))
  return { subtotal: base, serviceChargeAmount, taxAmount, totalAmount }
}

export function totalFromOrder(order) {
  return normalizePrice(order.total_amount || order.totalAmount || order.subtotal)
}
