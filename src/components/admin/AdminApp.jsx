import { BarChart3, ClipboardList, CreditCard, Image, LogOut, Megaphone, MessageSquare, Printer, ReceiptText, Settings, Star, Store, Utensils, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import {
  deleteContactMessage,
  deleteOrder,
  deleteReservation,
  confirmCashPaymentForOrder,
  createPaymentRecord,
  deletePaymentRecord,
  fetchContactMessages,
  fetchOrders,
  fetchPayments,
  fetchReservations,
  updatePaymentRecord,
  updateMessageStatus,
  updateOrderPaymentStatus,
  updateOrderStatus,
  updateReservationStatus,
  createAdminOrder,
} from '../../services/adminService.js'
import { fetchAuditLogs, logAuditEvent } from '../../services/auditService.js'
import { canAccessModule, getSessionUser, getUserRole, isStaffUser, signInAdmin, signOutAdmin } from '../../services/authService.js'
import {
  createGalleryItem,
  createPromotion,
  defaultBusinessSettings,
  deleteGalleryItem,
  deletePromotion,
  fetchAdminGalleryItems,
  fetchAdminPromotions,
  fetchBusinessSettings,
  saveBusinessSettings,
  updateGalleryItem,
  updatePromotion,
  uploadRestaurantAsset,
} from '../../services/contentService.js'
import { createMenuItem, deleteMenuItem, fetchAdminMenuItems, stringifyCustomizationOptions, updateMenuItem } from '../../services/menuService.js'
import { calculateOrderTotals, totalFromOrder } from '../../services/orderTotals.js'
import { createPaymentIntent, paymentProviders } from '../../services/paymentProviderService.js'
import { buildReport, calculateAnalytics } from '../../services/reportService.js'
import { deleteReview, fetchAdminReviews, updateReviewStatus } from '../../services/reviewService.js'
import { exportReportToExcel, exportReportToPdf } from '../../utils/exportReports.js'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'business', label: 'Business Settings', icon: Store },
  { id: 'reservations', label: 'Reservations', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'menu', label: 'Menu CRUD', icon: Utensils },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'promotions', label: 'Promotions', icon: Megaphone },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: ClipboardList },
]

const paymentMethods = ['Cash', 'Credit/Debit Card', 'Online Bank Transfer', 'TNG eWallet', 'GrabPay', 'DuitNow QR', 'Other']
const paymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled']

const emptyMenuForm = {
  name: '',
  description: '',
  price: '',
  category: 'Brunch',
  tag: 'Signature',
  image_url: '',
  customization_options: '',
  is_available: true,
  display_order: 0,
}

const emptyGalleryForm = {
  title: '',
  image_url: '',
  alt_text: '',
  display_order: 0,
  is_published: true,
}

const emptyPromotionForm = {
  title: '',
  description: '',
  offer_text: '',
  image_url: '',
  whatsapp_message: defaultBusinessSettings.promotionWhatsAppMessage,
  display_order: 0,
  is_active: true,
}

function matchesQuery(row, query, fields) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return fields.some((field) => String(row[field] || '').toLowerCase().includes(normalized))
}

function AdminFilters({ query, onQueryChange, status, onStatusChange, statusOptions, placeholder, allLabel = 'All statuses' }) {
  const labels = { true: 'Available', false: 'Unavailable' }

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 bg-white p-5 sm:flex-row">
      <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="focus-ring min-h-11 flex-1 rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm" placeholder={placeholder} />
      <select value={status} onChange={(event) => onStatusChange(event.target.value)} className="focus-ring min-h-11 rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm">
        <option value="all">{allLabel}</option>
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {labels[option] || option}
          </option>
        ))}
      </select>
    </div>
  )
}

function DangerButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="font-bold text-red-700">
      {children}
    </button>
  )
}

function ImageUploadField({ label, value, onUploaded, folder }) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')
    try {
      const url = await uploadRestaurantAsset(file, folder)
      onUploaded(url)
      setMessage('Image uploaded.')
    } catch (error) {
      setMessage(error.message || 'Image upload failed. Check Supabase Storage bucket and policies.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <label className="grid gap-2 text-sm font-bold text-cafe-ink">
      {label}
      <input type="file" accept="image/*" onChange={upload} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" />
      {value ? <img src={value} alt={`${label} preview`} className="h-28 w-40 rounded-lg border border-stone-200 object-cover" /> : null}
      {uploading ? <span className="text-xs font-normal text-stone-500">Uploading...</span> : null}
      {message ? <span className="text-xs font-normal text-stone-500">{message}</span> : null}
    </label>
  )
}

function printReceipt(payment, order, business = defaultBusinessSettings) {
  const receipt = window.open('', '_blank', 'width=420,height=640')
  if (!receipt) return
  const orderNumber = order?.id ? order.id.slice(0, 8).toUpperCase() : payment.order_id?.slice(0, 8).toUpperCase() || 'MANUAL'
  const items = order?.order_items || []
  const subtotal = formatCurrency(order?.subtotal || payment.amount)
  const serviceCharge = formatCurrency(order?.service_charge_amount || 0)
  const tax = formatCurrency(order?.tax_amount || 0)
  const total = formatCurrency(order?.total_amount || payment.amount)
  receipt.document.write(`
    <html>
      <head>
        <title>Receipt ${orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #18211c; }
          h1 { font-size: 24px; margin: 0 0 4px; }
          .muted { color: #666; font-size: 13px; }
          .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0; gap: 16px; }
          .total { font-size: 22px; font-weight: 700; }
          .item { border-bottom: 1px dashed #ddd; padding: 8px 0; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${business.name || 'Amber & Oak Cafe'}</h1>
        <p class="muted">${business.address || ''}</p>
        <p class="muted">${business.phoneDisplay || ''}</p>
        <p class="muted">Payment Receipt</p>
        <div class="row"><strong>Order No.</strong><span>${orderNumber}</span></div>
        <div class="row"><strong>Customer</strong><span>${payment.customer_name}</span></div>
        ${items.length ? `<h2>Items</h2>${items.map((item) => `<div class="item"><strong>${item.quantity}x ${item.item_name}</strong><br><span class="muted">${formatCurrency(item.unit_price)} each ${item.notes ? `- ${item.notes}` : ''}</span><span style="float:right">${formatCurrency(item.line_total || item.unit_price * item.quantity)}</span></div>`).join('')}` : ''}
        <div class="row"><strong>Subtotal</strong><span>${subtotal}</span></div>
        <div class="row"><strong>Service Charge</strong><span>${serviceCharge}</span></div>
        <div class="row"><strong>Tax</strong><span>${tax}</span></div>
        <div class="row"><strong>Payment Method</strong><span>${payment.payment_method}</span></div>
        <div class="row"><strong>Status</strong><span>${payment.payment_status}</span></div>
        <div class="row"><strong>Date</strong><span>${formatDateTime(payment.payment_date)}</span></div>
        <div class="row"><strong>Reference</strong><span>${payment.transaction_reference || '-'}</span></div>
        <div class="row total"><strong>Total</strong><span>${total}</span></div>
        <p class="muted">This receipt was generated from the admin payment tracking system.</p>
        <button onclick="window.print()">Print Receipt</button>
      </body>
    </html>
  `)
  receipt.document.close()
}

function paymentMethodSummary(payments) {
  const summary = new Map()
  for (const payment of payments.filter((item) => item.payment_status === 'Paid')) {
    summary.set(payment.payment_method, (summary.get(payment.payment_method) || 0) + Number(payment.amount || 0))
  }
  return Array.from(summary, ([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount)
}

function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    if (!isSupabaseConfigured) {
      setStatus('Supabase is not configured yet. Add env vars before admin login testing.')
      return
    }

    setLoading(true)
    try {
      const user = await signInAdmin(form.email, form.password)
      onLogin(user)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-cafe-cream px-5 py-16">
      <form onSubmit={submit} className="mx-auto max-w-md rounded-lg border border-stone-200 bg-white p-8 shadow-soft">
        <p className="eyebrow">Admin Login</p>
        <h1 className="mt-3 font-display text-4xl">Amber & Oak Cafe</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Sign in with a Supabase Auth user that has app_metadata.role set to admin, manager, or staff.</p>
        <div className="mt-6 grid gap-4">
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Admin email" />
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Password" />
        </div>
        <button disabled={loading} className="focus-ring mt-6 w-full rounded-full bg-cafe-ink px-6 py-4 text-sm font-bold text-white disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {status ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{status}</p> : null}
      </form>
    </main>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 font-display text-3xl text-cafe-ink">{value}</p>
    </div>
  )
}

function Overview({ dataset }) {
  const analytics = useMemo(() => calculateAnalytics(dataset), [dataset])
  const recentActivity = useMemo(
    () =>
      [
        ...dataset.reservations.map((item) => ({ id: `reservation-${item.id}`, type: 'Reservation', title: item.customer_name, detail: `${item.guests} guests on ${formatDate(item.reservation_date)}`, created_at: item.created_at })),
        ...dataset.messages.map((item) => ({ id: `message-${item.id}`, type: 'Message', title: item.name, detail: item.message, created_at: item.created_at })),
        ...dataset.orders.map((item) => ({ id: `order-${item.id}`, type: 'Order', title: item.customer_name, detail: `${formatCurrency(item.subtotal)} - ${item.status}`, created_at: item.created_at })),
        ...dataset.payments.map((item) => ({ id: `payment-${item.id}`, type: 'Payment', title: item.customer_name, detail: `${formatCurrency(item.amount)} - ${item.payment_status}`, created_at: item.payment_date || item.created_at })),
      ]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6),
    [dataset],
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(analytics.totalRevenue)} />
        <StatCard label="Monthly revenue" value={formatCurrency(analytics.monthlyRevenueAmount)} />
        <StatCard label="Total orders" value={analytics.totalOrders} />
        <StatCard label="Pending payments" value={formatCurrency(analytics.pendingAmount)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Monthly sales chart</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => (name === 'orders' ? value : formatCurrency(value))} />
                <Bar dataKey="revenue" fill="#b7791f" radius={[8, 8, 0, 0]} />
                <Bar dataKey="orders" fill="#51624f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Top selling menu items</h2>
          <div className="mt-5 grid gap-3">
            {analytics.topSellingItems.length ? (
              analytics.topSellingItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-cafe-cream px-4 py-3">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-sm text-stone-600">{item.quantity} sold</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-600">No completed order data yet.</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reservations" value={analytics.reservationsTotal} />
        <StatCard label="Pending reservations" value={analytics.reservationsPending} />
        <StatCard label="New messages" value={analytics.messagesNew} />
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">Recent activity</h2>
        <div className="mt-5 grid gap-3">
          {recentActivity.length ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="grid gap-1 rounded-lg bg-cafe-cream px-4 py-3 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-cafe-copper">{activity.type}</span>
                <span className="font-bold">{activity.title}</span>
                <span className="text-sm text-stone-600">{activity.detail}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-600">No recent activity yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReservationsPanel({ rows, refresh }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filteredRows = rows.filter((row) => matchesQuery(row, query, ['customer_name', 'phone', 'email', 'notes'])).filter((row) => status === 'all' || row.status === status)

  const update = async (id, status) => {
    await updateReservationStatus(id, status)
    refresh()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this reservation?')) return
    await deleteReservation(id)
    refresh()
  }

  return (
    <div className="grid gap-4">
      <AdminFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} statusOptions={['pending', 'confirmed', 'cancelled', 'completed']} placeholder="Search by name, phone, email, or request" />
      <DataTable
        title="Reservations management"
        rows={filteredRows}
        headers={['Date', 'Customer', 'Phone', 'Guests', 'Request', 'Status', 'Action']}
        render={(row) => [
          `${formatDate(row.reservation_date)} ${row.reservation_time}`,
          row.customer_name,
          row.phone,
          row.guests,
          row.notes || '-',
          row.status,
          <span key={row.id} className="inline-flex flex-wrap gap-3">
            <StatusSelect value={row.status} options={['pending', 'confirmed', 'cancelled', 'completed']} onChange={(value) => update(row.id, value)} />
            <DangerButton onClick={() => remove(row.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function MessagesPanel({ rows, refresh }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filteredRows = rows.filter((row) => matchesQuery(row, query, ['name', 'phone', 'email', 'message'])).filter((row) => status === 'all' || row.status === status)

  const update = async (id, status) => {
    await updateMessageStatus(id, status)
    refresh()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this message?')) return
    await deleteContactMessage(id)
    refresh()
  }

  return (
    <div className="grid gap-4">
      <AdminFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} statusOptions={['new', 'read', 'replied', 'archived']} placeholder="Search by name, phone, email, or message" />
      <DataTable
        title="Contact messages management"
        rows={filteredRows}
        headers={['Date', 'Name', 'Phone / Email', 'Message', 'Status', 'Action']}
        render={(row) => [
          formatDateTime(row.created_at),
          row.name,
          <span key={`${row.id}-contact`}>{row.phone}{row.email ? <><br />{row.email}</> : null}</span>,
          row.message,
          row.status,
          <span key={row.id} className="inline-flex flex-wrap gap-3">
            <StatusSelect value={row.status} options={['new', 'read', 'replied', 'archived']} onChange={(value) => update(row.id, value)} />
            <DangerButton onClick={() => remove(row.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function AdminCreateOrderForm({ refresh }) {
  const [menuItems, setMenuItems] = useState([])
  const [settings, setSettings] = useState(defaultBusinessSettings)
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', order_type: 'pickup', status: 'pending', payment_status: 'Pending' })
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const selected = menuItems.filter((item) => Number(item.quantity) > 0)
  const subtotal = selected.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  const totals = calculateOrderTotals(subtotal, settings)

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const [items, business] = await Promise.all([fetchAdminMenuItems(), fetchBusinessSettings()])
        setMenuItems(items.map((item) => ({ ...item, quantity: 0, notes: '', customizations: {} })))
        setSettings(business)
      } catch (error) {
        setMessage(error.message)
      }
    })
  }, [])

  const updateQuantity = (id, quantity) => {
    setMenuItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!customer.name.trim() || !customer.phone.trim() || selected.length === 0) {
      setMessage('Add customer name, phone, and at least one item.')
      return
    }

    try {
      const order = await createAdminOrder({ customer, items: selected, notes, settings })
      await createPaymentIntent({ providerId: settings.provider, order })
      setCustomer({ name: '', phone: '', email: '', order_type: 'pickup', status: 'pending', payment_status: 'Pending' })
      setNotes('')
      setMenuItems((current) => current.map((item) => ({ ...item, quantity: 0, notes: '', customizations: {} })))
      setMessage('Admin order created.')
      refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl">Create order</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <input value={customer.name} onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Customer name" />
        <input value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Phone" />
        <input value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Email optional" />
        <select value={customer.order_type} onChange={(event) => setCustomer((current) => ({ ...current, order_type: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
          <option value="pickup">Pickup</option>
          <option value="dine-in">Dine-in</option>
          <option value="delivery">Delivery</option>
        </select>
        <select value={customer.status} onChange={(event) => setCustomer((current) => ({ ...current, status: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
          {['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={customer.payment_status} onChange={(event) => setCustomer((current) => ({ ...current, payment_status: event.target.value }))} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
          {paymentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {menuItems.map((item) => (
          <label key={item.id} className="grid gap-2 rounded-lg bg-cafe-cream p-4 text-sm font-bold">
            <span>{item.name} <span className="font-normal text-stone-500">{formatCurrency(item.price)}</span></span>
            <input type="number" min="0" max="99" value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))} className="focus-ring rounded-lg border border-stone-300 bg-white px-4 py-2 font-normal" />
          </label>
        ))}
      </div>
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="focus-ring mt-5 min-h-20 w-full resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Order notes" />
      <div className="mt-5 grid gap-3 rounded-lg bg-cafe-cream p-4 text-sm sm:grid-cols-4">
        <span><strong>Subtotal:</strong> {formatCurrency(totals.subtotal)}</span>
        <span><strong>Service:</strong> {formatCurrency(totals.serviceChargeAmount)}</span>
        <span><strong>Tax:</strong> {formatCurrency(totals.taxAmount)}</span>
        <span><strong>Total:</strong> {formatCurrency(totals.totalAmount)}</span>
      </div>
      <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Create Order</button>
      {message ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{message}</p> : null}
    </form>
  )
}

function OrdersPanel({ rows, payments = [], refresh }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filteredRows = rows
    .filter((row) => matchesQuery(row, query, ['customer_name', 'phone', 'email', 'notes']))
    .filter((row) => status === 'all' || row.status === status)

  const update = async (order, status) => {
    if (status === 'completed' && order.payment_status !== 'Paid') {
      if (!window.confirm('This order is not paid yet. Confirm cash payment and complete the order?')) return
      await confirmCashPaymentForOrder(order)
    }
    await updateOrderStatus(order.id, status)
    refresh()
  }

  const updatePayment = async (id, paymentStatus) => {
    await updateOrderPaymentStatus(id, paymentStatus)
    refresh()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this order and its items?')) return
    await deleteOrder(id)
    refresh()
  }

  return (
    <div className="grid gap-4">
      <AdminCreateOrderForm refresh={refresh} />
      <AdminFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} statusOptions={['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']} placeholder="Search by customer, phone, email, or notes" />
      <DataTable
        title="Orders management"
        rows={filteredRows}
        headers={['Date', 'Customer', 'Items', 'Order Notes', 'Revenue', 'Payment', 'Status', 'Action']}
        render={(row) => [
          formatDateTime(row.created_at),
          <span key={`${row.id}-customer`}>{row.customer_name}<br /><span className="text-xs text-stone-500">{row.phone}</span></span>,
          <div key={`${row.id}-items`} className="grid gap-3">
            {(row.order_items || []).map((item) => (
              <div key={item.id} className="rounded-lg bg-cafe-cream px-3 py-2">
                <p className="font-bold">{item.quantity}x {item.item_name}</p>
                {item.customizations && Object.keys(item.customizations).length ? (
                  <p className="mt-1 text-xs text-stone-600">
                    {Object.entries(item.customizations).map(([name, value]) => `${name}: ${value}`).join(', ')}
                  </p>
                ) : null}
                {item.notes ? <p className="mt-1 text-xs text-stone-600">Note: {item.notes}</p> : null}
              </div>
            ))}
            {row.order_items?.length ? null : '-'}
          </div>,
          row.notes || '-',
          <span key={`${row.id}-revenue`}>{formatCurrency(totalFromOrder(row))}<br /><span className="text-xs text-stone-500">Subtotal {formatCurrency(row.subtotal)}</span></span>,
          <StatusSelect key={`${row.id}-payment`} value={row.payment_status || 'Pending'} options={paymentStatuses} onChange={(value) => updatePayment(row.id, value)} />,
          row.status,
          <span key={row.id} className="inline-flex flex-wrap gap-3">
            <StatusSelect value={row.status} options={['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']} onChange={(value) => update(row, value)} />
            {(payments || []).some((payment) => payment.order_id === row.id && payment.payment_status === 'Paid') ? (
              <button type="button" onClick={() => printReceipt((payments || []).find((payment) => payment.order_id === row.id && payment.payment_status === 'Paid'), row)} className="inline-flex items-center gap-1 font-bold text-cafe-copper">
                <Printer size={14} aria-hidden="true" /> Receipt
              </button>
            ) : null}
            <DangerButton onClick={() => remove(row.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function StatusSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function DataTable({ title, rows, headers, render }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 p-5">
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-cafe-cream text-xs uppercase tracking-[0.14em] text-stone-600">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-stone-100 align-top">
                  {render(row).map((cell, index) => (
                    <td key={`${row.id}-${index}`} className="max-w-sm px-4 py-3">{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-stone-500">No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BusinessSettingsPanel() {
  const [form, setForm] = useState(defaultBusinessSettings)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBusinessSettings()
      .then((settings) => setForm({ ...defaultBusinessSettings, ...settings }))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      const saved = await saveBusinessSettings(form)
      setForm({ ...defaultBusinessSettings, ...saved })
      setMessage('Business settings saved. Refresh the public website to see the changes.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (loading) return <p className="rounded-lg bg-white p-5 shadow-sm">Loading business settings...</p>

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">Business Settings</h2>
        <p className="mt-1 text-sm text-stone-600">Edit the client business identity, WhatsApp, SEO, location, and payment instructions from one place.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="name" value={form.name} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Restaurant name" />
          <input name="brandLabel" value={form.brandLabel} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Brand label" />
          <input name="tagline" value={form.tagline} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Tagline" />
          <textarea name="shortDescription" value={form.shortDescription} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Short description" />
          <input name="phoneDisplay" value={form.phoneDisplay} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Phone display" />
          <input name="phoneRaw" value={form.phoneRaw} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="WhatsApp number, for example 60123456789" />
          <input name="email" value={form.email} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Email" />
          <input name="mapUrl" value={form.mapUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Google Maps link" />
          <textarea name="address" value={form.address} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Address" />
          <textarea name="openingHoursText" value={form.openingHoursText} onChange={change} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder={'Monday - Friday: 7:00 AM - 9:30 PM\nSaturday - Sunday: 8:00 AM - 10:30 PM'} />
          <input name="instagramUrl" value={form.instagramUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Instagram URL" />
          <input name="facebookUrl" value={form.facebookUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Facebook URL" />
          <input name="tiktokUrl" value={form.tiktokUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="TikTok URL" />
          <input name="websiteUrl" value={form.websiteUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Website URL" />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">Homepage and SEO</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="heroEyebrow" value={form.heroEyebrow} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Hero eyebrow" />
          <input name="heroTitle" value={form.heroTitle} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Hero title" />
          <textarea name="heroCopy" value={form.heroCopy} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Hero copy" />
          <input name="heroPrimaryLabel" value={form.heroPrimaryLabel} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Primary CTA label" />
          <input name="heroSecondaryLabel" value={form.heroSecondaryLabel} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Secondary CTA label" />
          <input name="heroImageUrl" value={form.heroImageUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Hero image URL" />
          <ImageUploadField label="Upload hero image" value={form.heroImageUrl} folder="hero" onUploaded={(url) => setForm((current) => ({ ...current, heroImageUrl: url }))} />
          <input name="seoTitle" value={form.seoTitle} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="SEO title" />
          <textarea name="seoDescription" value={form.seoDescription} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="SEO description" />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">About, WhatsApp, and Payment Template</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="aboutTitle" value={form.aboutTitle} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="About title" />
          <textarea name="aboutCopy" value={form.aboutCopy} onChange={change} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="About text" />
          <input name="aboutImageUrl" value={form.aboutImageUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="About image URL" />
          <ImageUploadField label="Upload about image" value={form.aboutImageUrl} folder="about" onUploaded={(url) => setForm((current) => ({ ...current, aboutImageUrl: url }))} />
          <input name="aboutBadgeTitle" value={form.aboutBadgeTitle} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="About badge title" />
          <input name="aboutBadgeText" value={form.aboutBadgeText} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="About badge text" />
          <textarea name="reservationWhatsAppMessage" value={form.reservationWhatsAppMessage} onChange={change} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Reservation WhatsApp template" />
          <textarea name="orderWhatsAppMessage" value={form.orderWhatsAppMessage} onChange={change} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Order WhatsApp template" />
          <textarea name="contactWhatsAppMessage" value={form.contactWhatsAppMessage} onChange={change} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Contact WhatsApp template" />
          <textarea name="promotionWhatsAppMessage" value={form.promotionWhatsAppMessage} onChange={change} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Promotion WhatsApp template" />
          <label className="inline-flex items-center gap-3 text-sm font-bold lg:col-span-2">
            <input type="checkbox" name="paymentInstructionsEnabled" checked={form.paymentInstructionsEnabled} onChange={change} />
            Show payment instructions after order submission
          </label>
          <textarea name="paymentInstructions" value={form.paymentInstructions} onChange={change} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Bank, eWallet, QR, or manual payment instructions" />
          <input name="paymentEnabledMethods" value={form.paymentEnabledMethods} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Enabled payment methods" />
          <input name="paymentQrImageUrl" value={form.paymentQrImageUrl} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Payment QR image URL" />
          <ImageUploadField label="Upload payment QR" value={form.paymentQrImageUrl} folder="payment" onUploaded={(url) => setForm((current) => ({ ...current, paymentQrImageUrl: url }))} />
          <input name="serviceChargePercent" type="number" min="0" step="0.1" value={form.serviceChargePercent} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Service charge percent" />
          <input name="taxPercent" type="number" min="0" step="0.1" value={form.taxPercent} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Tax percent" />
          <select name="provider" value={form.provider} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
            {paymentProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
          </select>
          <input name="providerPublicLabel" value={form.providerPublicLabel} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Provider label" />
        </div>
      </section>

      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <button className="focus-ring rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Business Settings</button>
        {message ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{message}</p> : null}
      </div>
    </form>
  )
}

function GalleryPanel() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyGalleryForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  const refresh = async () => setItems(await fetchAdminGalleryItems())

  useEffect(() => {
    queueMicrotask(() => {
      refresh().catch((error) => setMessage(error.message))
    })
  }, [])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.image_url.trim()) {
      setMessage('Please upload an image or add an image URL.')
      return
    }
    try {
      if (editingId) await updateGalleryItem(editingId, form)
      else await createGalleryItem(form)
      setForm(emptyGalleryForm)
      setEditingId(null)
      setMessage('Gallery item saved.')
      await refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({ ...emptyGalleryForm, ...item })
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this gallery item?')) return
    await deleteGalleryItem(id)
    await refresh()
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">{editingId ? 'Edit gallery item' : 'Add gallery item'}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="title" value={form.title} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Title" />
          <input name="display_order" type="number" value={form.display_order} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Display order" />
          <input name="image_url" value={form.image_url} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Image URL" />
          <ImageUploadField label="Upload gallery image" value={form.image_url} folder="gallery" onUploaded={(url) => setForm((current) => ({ ...current, image_url: url }))} />
          <input name="alt_text" value={form.alt_text} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Alt text / caption" />
          <label className="inline-flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={change} />
            Published on public gallery
          </label>
        </div>
        <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Gallery Item</button>
        {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyGalleryForm) }} className="ml-3 text-sm font-bold text-cafe-copper">Cancel</button> : null}
        {message ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{message}</p> : null}
      </form>

      <DataTable
        title="Gallery items"
        rows={items}
        headers={['Preview', 'Title', 'Published', 'Order', 'Actions']}
        render={(item) => [
          <img key={`${item.id}-image`} src={item.image_url} alt={item.alt_text || item.title} className="h-16 w-24 rounded-lg object-cover" />,
          item.title,
          item.is_published ? 'Yes' : 'No',
          item.display_order,
          <span key={item.id} className="inline-flex gap-2">
            <button type="button" onClick={() => edit(item)} className="font-bold text-cafe-copper">Edit</button>
            <DangerButton onClick={() => remove(item.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function PromotionsPanel() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyPromotionForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  const refresh = async () => setItems(await fetchAdminPromotions())

  useEffect(() => {
    queueMicrotask(() => {
      refresh().catch((error) => setMessage(error.message))
    })
  }, [])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await updatePromotion(editingId, form)
      else await createPromotion(form)
      setForm(emptyPromotionForm)
      setEditingId(null)
      setMessage('Promotion saved.')
      await refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({ ...emptyPromotionForm, ...item })
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this promotion?')) return
    await deletePromotion(id)
    await refresh()
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">{editingId ? 'Edit promotion' : 'Add promotion'}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="title" value={form.title} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Promotion title" />
          <input name="offer_text" value={form.offer_text} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Offer text, for example RM 88" />
          <textarea name="description" value={form.description} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Promotion description" />
          <input name="image_url" value={form.image_url || ''} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 lg:col-span-2" placeholder="Promotion image URL optional" />
          <ImageUploadField label="Upload promotion image" value={form.image_url} folder="promotions" onUploaded={(url) => setForm((current) => ({ ...current, image_url: url }))} />
          <textarea name="whatsapp_message" value={form.whatsapp_message} onChange={change} className="focus-ring min-h-20 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="WhatsApp message template" />
          <input name="display_order" type="number" value={form.display_order} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Display order" />
          <label className="inline-flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={change} />
            Active on public website
          </label>
        </div>
        <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Promotion</button>
        {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyPromotionForm) }} className="ml-3 text-sm font-bold text-cafe-copper">Cancel</button> : null}
        {message ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{message}</p> : null}
      </form>

      <DataTable
        title="Promotions"
        rows={items}
        headers={['Title', 'Offer', 'Active', 'Order', 'Actions']}
        render={(item) => [
          item.title,
          item.offer_text,
          item.is_active ? 'Yes' : 'No',
          item.display_order,
          <span key={item.id} className="inline-flex gap-2">
            <button type="button" onClick={() => edit(item)} className="font-bold text-cafe-copper">Edit</button>
            <DangerButton onClick={() => remove(item.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function MenuCrudPanel() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyMenuForm)
  const [editingId, setEditingId] = useState(null)
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [availability, setAvailability] = useState('all')
  const filteredItems = items
    .filter((item) => matchesQuery(item, query, ['name', 'description', 'category', 'tag']))
    .filter((item) => availability === 'all' || String(item.is_available) === availability)

  const load = async () => setItems(await fetchAdminMenuItems())

  useEffect(() => {
    queueMicrotask(() => {
      load().catch((error) => setStatus(error.message))
    })
  }, [])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.description.trim() || Number(form.price) < 0 || form.price === '') {
      setStatus('Please add product name, description, and a valid price.')
      return
    }

    try {
      if (editingId) {
        await updateMenuItem(editingId, form)
      } else {
        await createMenuItem(form)
      }
      setForm(emptyMenuForm)
      setEditingId(null)
      await load()
      setStatus('Menu saved.')
    } catch (error) {
      setStatus(error.message)
    }
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({ ...emptyMenuForm, ...item, price: item.price ?? '', customization_options: stringifyCustomizationOptions(item.customization_options) })
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this menu item?')) return
    await deleteMenuItem(id)
    await load()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">{editingId ? 'Edit menu item' : 'Add menu item'}</h2>
        <div className="mt-5 grid gap-4">
          <input name="name" value={form.name} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Product name" />
          <textarea name="description" value={form.description} onChange={change} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Product description" />
          <input name="price" value={form.price} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Price, for example 28" />
          <input name="category" value={form.category} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Category, for example Brunch" />
          <input name="tag" value={form.tag} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Menu badge, for example Signature" />
          <input name="image_url" value={form.image_url} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Image URL optional" />
          <ImageUploadField label="Upload menu image" value={form.image_url} folder="menu" onUploaded={(url) => setForm((current) => ({ ...current, image_url: url }))} />
          <input name="display_order" value={form.display_order} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Display order" />
          <label className="grid gap-2 text-sm font-bold">
            Customization options
            <textarea name="customization_options" value={form.customization_options} onChange={change} className="focus-ring min-h-28 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3 font-normal" placeholder={'Add peanut: No, Yes\nSpicy level: Normal, Less spicy, Extra spicy'} />
            <span className="text-xs font-normal leading-5 text-stone-500">One option per line. Use this format: Option name: Choice 1, Choice 2</span>
          </label>
          <label className="inline-flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="is_available" checked={form.is_available} onChange={change} />
            Available on public menu
          </label>
        </div>
        <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Menu Item</button>
        {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyMenuForm) }} className="ml-3 text-sm font-bold text-cafe-copper">Cancel</button> : null}
        {status ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{status}</p> : null}
      </form>

      <div className="grid gap-4">
        <AdminFilters query={query} onQueryChange={setQuery} status={availability} onStatusChange={setAvailability} statusOptions={['true', 'false']} placeholder="Search by product, description, category, or tag" allLabel="All availability" />
        <DataTable
          title="Menu items"
          rows={filteredItems}
          headers={['Name', 'Category', 'Price', 'Options', 'Available', 'Actions']}
          render={(item) => [
            item.name,
            item.category,
            formatCurrency(item.price),
            stringifyCustomizationOptions(item.customization_options) || '-',
            item.is_available ? 'Yes' : 'No',
            <span key={item.id} className="inline-flex gap-2">
              <button type="button" onClick={() => edit(item)} className="font-bold text-cafe-copper">Edit</button>
              <DangerButton onClick={() => remove(item.id)}>Delete</DangerButton>
            </span>,
          ]}
        />
      </div>
    </div>
  )
}

function ReviewsPanel({ rows, refresh }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filteredRows = rows
    .filter((row) => matchesQuery(row, query, ['customer_name', 'comment', 'menu_item_name']))
    .filter((row) => status === 'all' || row.status === status)

  const update = async (review, nextStatus) => {
    await updateReviewStatus(review.id, nextStatus)
    await logAuditEvent({ action: 'review.status_update', entityType: 'review', entityId: review.id, summary: `Review marked ${nextStatus}.`, metadata: { nextStatus } })
    refresh()
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return
    await deleteReview(id)
    await logAuditEvent({ action: 'review.delete', entityType: 'review', entityId: id, summary: 'Review deleted.' })
    refresh()
  }

  return (
    <div className="grid gap-4">
      <AdminFilters query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus} statusOptions={['pending', 'approved', 'hidden']} placeholder="Search by customer, menu item, or comment" />
      <DataTable
        title="Customer reviews"
        rows={filteredRows}
        headers={['Date', 'Customer', 'Rating', 'Comment', 'Status', 'Action']}
        render={(row) => [
          formatDateTime(row.created_at),
          <span key={`${row.id}-customer`}>{row.customer_name}<br /><span className="text-xs text-stone-500">{row.menu_item_name || '-'}</span></span>,
          `${row.rating} / 5`,
          row.comment,
          row.status,
          <span key={row.id} className="inline-flex flex-wrap gap-3">
            <StatusSelect value={row.status} options={['pending', 'approved', 'hidden']} onChange={(value) => update(row, value)} />
            <DangerButton onClick={() => remove(row.id)}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function AuditLogPanel({ rows }) {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('all')
  const actions = Array.from(new Set(rows.map((row) => row.action))).filter(Boolean)
  const filteredRows = rows
    .filter((row) => matchesQuery(row, query, ['actor_email', 'actor_role', 'action', 'entity_type', 'summary']))
    .filter((row) => action === 'all' || row.action === action)

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring min-h-11 flex-1 rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm" placeholder="Search actor, action, entity, summary" />
        <select value={action} onChange={(event) => setAction(event.target.value)} className="focus-ring min-h-11 rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm">
          <option value="all">All actions</option>
          {actions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <DataTable
        title="Audit log"
        rows={filteredRows}
        headers={['Date', 'Actor', 'Role', 'Action', 'Entity', 'Summary']}
        render={(row) => [
          formatDateTime(row.created_at),
          row.actor_email || '-',
          row.actor_role || '-',
          row.action,
          row.entity_type,
          row.summary || '-',
        ]}
      />
    </div>
  )
}

function PaymentsPanel({ rows, orders, refresh, business }) {
  const [form, setForm] = useState({
    order_id: '',
    customer_name: '',
    amount: '',
    payment_method: 'Cash',
    payment_status: 'Pending',
    transaction_reference: '',
    payment_date: new Date().toISOString().slice(0, 16),
    notes: '',
  })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const filteredRows = rows
    .filter((row) => matchesQuery(row, query, ['customer_name', 'transaction_reference', 'notes', 'order_id']))
    .filter((row) => status === 'all' || row.payment_status === status)
    .filter((row) => method === 'all' || row.payment_method === method)
    .filter((row) => !date || String(row.payment_date || '').slice(0, 10) === date)
  const paidTotal = rows.filter((row) => row.payment_status === 'Paid').reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const paidOrderIds = new Set(rows.filter((row) => row.payment_status === 'Paid').map((row) => row.order_id).filter(Boolean))
  const paymentOrderIds = new Set(rows.map((row) => row.order_id).filter(Boolean))
  const pendingTotal = rows.filter((row) => row.payment_status === 'Pending').reduce((sum, row) => sum + Number(row.amount || 0), 0)
    + orders
      .filter((order) => !paidOrderIds.has(order.id) && !paymentOrderIds.has(order.id) && order.payment_status !== 'Paid' && order.status !== 'cancelled')
      .reduce((sum, order) => sum + totalFromOrder(order), 0)
  const methodSummary = paymentMethodSummary(rows)

  const change = (event) => {
    const { name, value } = event.target
    if (name === 'order_id') {
      const order = orders.find((item) => item.id === value)
      setForm((current) => ({
        ...current,
        order_id: value,
        customer_name: order?.customer_name || current.customer_name,
        amount: order ? totalFromOrder(order) : current.amount,
      }))
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.customer_name.trim() || Number(form.amount) <= 0) {
      setMessage('Please add customer name and a valid amount.')
      return
    }
    try {
      await createPaymentRecord({ ...form, payment_date: new Date(form.payment_date).toISOString() })
      setForm({ order_id: '', customer_name: '', amount: '', payment_method: 'Cash', payment_status: 'Pending', transaction_reference: '', payment_date: new Date().toISOString().slice(0, 16), notes: '' })
      setMessage('Payment record saved.')
      refresh()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const updateStatus = async (payment, paymentStatus) => {
    await updatePaymentRecord(payment.id, { payment_status: paymentStatus })
    refresh()
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total paid revenue" value={formatCurrency(paidTotal)} />
        <StatCard label="Unpaid / pending amount" value={formatCurrency(pendingTotal)} />
        <StatCard label="Payment records" value={rows.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Add manual payment</h2>
          <div className="mt-5 grid gap-4">
            <select name="order_id" value={form.order_id} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
              <option value="">No linked order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.customer_name} - {formatCurrency(totalFromOrder(order))} - {order.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input name="customer_name" value={form.customer_name} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Customer name" />
            <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Amount" />
            <select name="payment_method" value={form.payment_method} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
              {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select name="payment_status" value={form.payment_status} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3">
              {paymentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input name="transaction_reference" value={form.transaction_reference} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Reference number optional" />
            <input name="payment_date" type="datetime-local" value={form.payment_date} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" />
            <textarea name="notes" value={form.notes} onChange={change} className="focus-ring min-h-24 resize-y rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder="Payment notes" />
          </div>
          <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Payment</button>
          {message ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{message}</p> : null}
        </form>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Revenue by payment method</h2>
          <div className="mt-5 grid gap-3">
            {methodSummary.length ? methodSummary.map((item) => (
              <div key={item.method} className="flex items-center justify-between rounded-lg bg-cafe-cream px-4 py-3">
                <span className="font-bold">{item.method}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            )) : <p className="text-sm text-stone-600">No paid payment records yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-4">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm" placeholder="Search customer, order, reference" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          {paymentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={method} onChange={(event) => setMethod(event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm">
          <option value="all">All methods</option>
          {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-2 text-sm" />
      </div>

      <DataTable
        title="Payment records"
        rows={filteredRows}
        headers={['Date', 'Customer', 'Order', 'Method', 'Amount', 'Reference', 'Status', 'Action']}
        render={(payment) => [
          formatDateTime(payment.payment_date),
          payment.customer_name,
          payment.order_id ? payment.order_id.slice(0, 8).toUpperCase() : 'Manual',
          payment.payment_method,
          formatCurrency(payment.amount),
          payment.transaction_reference || '-',
          <StatusSelect key={`${payment.id}-status`} value={payment.payment_status} options={paymentStatuses} onChange={(value) => updateStatus(payment, value)} />,
          <span key={payment.id} className="inline-flex flex-wrap gap-3">
            {payment.payment_status === 'Paid' ? <button type="button" onClick={() => printReceipt(payment, orders.find((order) => order.id === payment.order_id), business)} className="inline-flex items-center gap-1 font-bold text-cafe-copper"><Printer size={14} aria-hidden="true" /> Receipt</button> : null}
            <DangerButton onClick={async () => { if (!window.confirm('Delete this payment record?')) return; await deletePaymentRecord(payment.id); refresh() }}>Delete</DangerButton>
          </span>,
        ]}
      />
    </div>
  )
}

function ReportsPanel({ dataset }) {
  const [range, setRange] = useState('monthly')
  const report = useMemo(() => buildReport(dataset, range), [dataset, range])
  const methodSummary = paymentMethodSummary(report.rows.payments || [])
  const actionPayments = (report.rows.payments || []).filter((payment) => ['Pending', 'Failed'].includes(payment.payment_status))
  const exportPdf = async () => {
    exportReportToPdf(report)
    await logAuditEvent({ action: 'report.export_pdf', entityType: 'report', summary: `${report.title} exported to PDF.`, metadata: { range } })
  }
  const exportExcel = async () => {
    exportReportToExcel(report)
    await logAuditEvent({ action: 'report.export_csv', entityType: 'report', summary: `${report.title} exported to CSV.`, metadata: { range } })
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl">{report.title}</h2>
          <p className="mt-1 text-sm text-stone-600">Filter business performance by reporting period.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['daily', 'weekly', 'monthly', 'yearly'].map((item) => (
            <button key={item} onClick={() => setRange(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${range === item ? 'bg-cafe-ink text-white' : 'bg-cafe-cream text-cafe-ink'}`}>
              {item}
            </button>
          ))}
          <button onClick={exportPdf} className="rounded-full bg-cafe-amber px-4 py-2 text-sm font-bold text-cafe-ink">PDF</button>
          <button onClick={exportExcel} className="rounded-full bg-cafe-forest px-4 py-2 text-sm font-bold text-white">Excel CSV</button>
        </div>
      </div>
      <Overview dataset={report.rows} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Revenue by payment method</h2>
          <div className="mt-5 grid gap-3">
            {methodSummary.length ? methodSummary.map((item) => (
              <div key={item.method} className="flex items-center justify-between rounded-lg bg-cafe-cream px-4 py-3">
                <span className="font-bold">{item.method}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            )) : <p className="text-sm text-stone-600">No paid payment records in this period.</p>}
          </div>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl">Failed / pending payments</h2>
          <div className="mt-5 grid gap-3">
            {actionPayments.length ? actionPayments.map((payment) => (
              <div key={payment.id} className="rounded-lg bg-cafe-cream px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{payment.customer_name}</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{payment.payment_method} - {payment.payment_status} - {payment.transaction_reference || 'No reference'}</p>
              </div>
            )) : <p className="text-sm text-stone-600">No failed or pending payments in this period.</p>}
          </div>
        </div>
      </div>
      <OrdersPanel rows={report.rows.orders} payments={report.rows.payments} refresh={() => {}} />
    </div>
  )
}

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [dataset, setDataset] = useState({ reservations: [], messages: [], orders: [], payments: [], reviews: [], auditLogs: [], business: defaultBusinessSettings })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const allowedTabs = tabs.filter((tab) => canAccessModule(user, tab.id))

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [reservations, messages, orders, payments, reviews, auditLogs, business] = await Promise.all([
        fetchReservations(),
        fetchContactMessages(),
        fetchOrders(),
        fetchPayments(),
        fetchAdminReviews(),
        canAccessModule(user, 'audit') ? fetchAuditLogs() : Promise.resolve([]),
        fetchBusinessSettings(),
      ])
      setDataset({ reservations, messages, orders, payments, reviews, auditLogs, business })
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      refresh()
    })
  }, [])

  const logout = async () => {
    await signOutAdmin()
    onLogout()
  }

  return (
    <div className="min-h-screen bg-cafe-cream text-cafe-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200 bg-white p-5 lg:block">
        <div className="font-display text-2xl">Amber & Oak Admin</div>
        <p className="mt-2 text-sm text-stone-600">{user.email}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-cafe-copper">{getUserRole(user) || 'staff'}</p>
        <nav className="mt-8 grid gap-2">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-bold ${activeTab === tab.id ? 'bg-cafe-ink text-white' : 'hover:bg-cafe-cream'}`}>
                <Icon size={18} aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </nav>
        <button onClick={logout} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-red-700">
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </aside>

      <main className="lg:pl-72">
        <div className="border-b border-stone-200 bg-white p-5 lg:hidden">
          <div className="font-display text-2xl">Amber & Oak Admin</div>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-cafe-copper">{getUserRole(user) || 'staff'}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-cafe-ink text-white shadow-sm'
                      : 'border border-stone-200 bg-cafe-cream text-cafe-ink hover:border-cafe-amber hover:bg-white'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="p-5 lg:p-8">
          {loading ? <p className="rounded-lg bg-white p-5 shadow-sm">Loading dashboard data...</p> : null}
          {error ? <p className="rounded-lg bg-red-50 p-5 text-red-800">{error}</p> : null}
          {!loading && !error && activeTab === 'overview' ? <Overview dataset={dataset} /> : null}
          {!loading && !error && activeTab === 'business' ? <BusinessSettingsPanel /> : null}
          {!loading && !error && activeTab === 'reservations' ? <ReservationsPanel rows={dataset.reservations} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'messages' ? <MessagesPanel rows={dataset.messages} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'menu' ? <MenuCrudPanel /> : null}
          {!loading && !error && activeTab === 'reviews' ? <ReviewsPanel rows={dataset.reviews} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'gallery' ? <GalleryPanel /> : null}
          {!loading && !error && activeTab === 'promotions' ? <PromotionsPanel /> : null}
          {!loading && !error && activeTab === 'orders' ? <OrdersPanel rows={dataset.orders} payments={dataset.payments} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'payments' ? <PaymentsPanel rows={dataset.payments} orders={dataset.orders} refresh={refresh} business={dataset.business} /> : null}
          {!loading && !error && activeTab === 'reports' ? <ReportsPanel dataset={dataset} /> : null}
          {!loading && !error && activeTab === 'audit' ? <AuditLogPanel rows={dataset.auditLogs} /> : null}
        </div>
      </main>
    </div>
  )
}

function AdminApp() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  const handleLogin = (sessionUser) => {
    window.history.replaceState(null, '', '/admin')
    setUser(sessionUser)
  }

  const handleLogout = () => {
    window.history.replaceState(null, '', '/admin/login')
    setUser(null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      queueMicrotask(() => setChecking(false))
      return
    }

    getSessionUser()
      .then((sessionUser) => setUser(isStaffUser(sessionUser) ? sessionUser : null))
      .finally(() => setChecking(false))
  }, [])

  if (checking) return <main className="min-h-screen bg-cafe-cream p-8">Checking admin session...</main>
  if (!user) {
    if (window.location.pathname !== '/admin/login') {
      window.history.replaceState(null, '', '/admin/login')
    }
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />
}

export default AdminApp
