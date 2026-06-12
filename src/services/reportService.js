import { normalizePrice } from '../utils/formatters.js'

export const reportRanges = {
  daily: 'Daily report',
  weekly: 'Weekly report',
  monthly: 'Monthly report',
  yearly: 'Yearly report',
}

export function getRangeStart(range, now = new Date()) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)

  if (range === 'weekly') {
    const day = date.getDay()
    const offset = day === 0 ? 6 : day - 1
    date.setDate(date.getDate() - offset)
  }

  if (range === 'monthly') {
    date.setDate(1)
  }

  if (range === 'yearly') {
    date.setMonth(0, 1)
  }

  return date
}

export function filterByRange(rows, range, dateField = 'created_at') {
  const start = getRangeStart(range)
  return rows.filter((row) => new Date(row[dateField]) >= start)
}

export function calculateAnalytics({ reservations = [], messages = [], orders = [] }) {
  const completedOrders = orders.filter((order) => order.status !== 'cancelled')
  const totalRevenue = completedOrders.reduce((sum, order) => sum + normalizePrice(order.subtotal), 0)
  const totalCustomers = new Set([
    ...orders.map((order) => order.phone),
    ...reservations.map((reservation) => reservation.phone),
    ...messages.map((message) => message.phone),
  ].filter(Boolean)).size

  const monthlyRevenueMap = new Map()
  const monthlyOrdersMap = new Map()
  const topItemsMap = new Map()

  for (const order of completedOrders) {
    const key = new Intl.DateTimeFormat('en-MY', { month: 'short', year: '2-digit' }).format(new Date(order.created_at))
    monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + normalizePrice(order.subtotal))
    monthlyOrdersMap.set(key, (monthlyOrdersMap.get(key) || 0) + 1)

    for (const item of order.order_items || []) {
      const current = topItemsMap.get(item.item_name) || { name: item.item_name, quantity: 0, revenue: 0 }
      current.quantity += Number(item.quantity || 0)
      current.revenue += normalizePrice(item.line_total || item.unit_price * item.quantity)
      topItemsMap.set(item.item_name, current)
    }
  }

  const monthlyRevenueChart = Array.from(monthlyRevenueMap, ([month, revenue]) => ({ month, revenue, orders: monthlyOrdersMap.get(month) || 0 }))
  const topSellingItems = Array.from(topItemsMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    totalRevenue,
    monthlyRevenueAmount: monthlyRevenueChart.at(-1)?.revenue || 0,
    totalOrders: orders.length,
    totalCustomers,
    reservationsTotal: reservations.length,
    reservationsPending: reservations.filter((item) => item.status === 'pending').length,
    reservationsConfirmed: reservations.filter((item) => item.status === 'confirmed').length,
    messagesNew: messages.filter((item) => item.status === 'new').length,
    monthlyRevenueChart,
    topSellingItems,
  }
}

export function buildReport(dataset, range) {
  const filtered = {
    reservations: filterByRange(dataset.reservations || [], range, 'created_at'),
    messages: filterByRange(dataset.messages || [], range, 'created_at'),
    orders: filterByRange(dataset.orders || [], range, 'created_at'),
  }

  return {
    title: reportRanges[range] || reportRanges.monthly,
    range,
    rows: filtered,
    analytics: calculateAnalytics(filtered),
  }
}
