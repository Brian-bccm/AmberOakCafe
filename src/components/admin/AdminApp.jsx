import { BarChart3, LogOut, MessageSquare, ReceiptText, Settings, Utensils, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import {
  deleteContactMessage,
  deleteOrder,
  deleteReservation,
  fetchContactMessages,
  fetchOrders,
  fetchReservations,
  updateMessageStatus,
  updateOrderPaymentStatus,
  updateOrderStatus,
  updateReservationStatus,
} from '../../services/adminService.js'
import { getSessionUser, isAdminUser, signInAdmin, signOutAdmin } from '../../services/authService.js'
import { createMenuItem, deleteMenuItem, fetchAdminMenuItems, stringifyCustomizationOptions, updateMenuItem } from '../../services/menuService.js'
import { buildReport, calculateAnalytics } from '../../services/reportService.js'
import { exportReportToExcel, exportReportToPdf } from '../../utils/exportReports.js'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters.js'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'reservations', label: 'Reservations', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'menu', label: 'Menu CRUD', icon: Utensils },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'reports', label: 'Reports', icon: Settings },
]

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
        <p className="mt-3 text-sm leading-6 text-stone-600">Sign in with a Supabase Auth user that has app_metadata.role set to admin.</p>
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
        <StatCard label="Total customers" value={analytics.totalCustomers} />
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

function OrdersPanel({ rows, refresh }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filteredRows = rows
    .filter((row) => matchesQuery(row, query, ['customer_name', 'phone', 'email', 'notes']))
    .filter((row) => status === 'all' || row.status === status)

  const update = async (id, status) => {
    await updateOrderStatus(id, status)
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
          formatCurrency(row.subtotal),
          <StatusSelect key={`${row.id}-payment`} value={row.payment_status || 'unpaid'} options={['unpaid', 'paid', 'refunded']} onChange={(value) => updatePayment(row.id, value)} />,
          row.status,
          <span key={row.id} className="inline-flex flex-wrap gap-3">
            <StatusSelect value={row.status} options={['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']} onChange={(value) => update(row.id, value)} />
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

function ReportsPanel({ dataset }) {
  const [range, setRange] = useState('monthly')
  const report = useMemo(() => buildReport(dataset, range), [dataset, range])

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
          <button onClick={() => exportReportToPdf(report)} className="rounded-full bg-cafe-amber px-4 py-2 text-sm font-bold text-cafe-ink">PDF</button>
          <button onClick={() => exportReportToExcel(report)} className="rounded-full bg-cafe-forest px-4 py-2 text-sm font-bold text-white">Excel CSV</button>
        </div>
      </div>
      <Overview dataset={report.rows} />
      <OrdersPanel rows={report.rows.orders} refresh={() => {}} />
    </div>
  )
}

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [dataset, setDataset] = useState({ reservations: [], messages: [], orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [reservations, messages, orders] = await Promise.all([fetchReservations(), fetchContactMessages(), fetchOrders()])
      setDataset({ reservations, messages, orders })
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
        <nav className="mt-8 grid gap-2">
          {tabs.map((tab) => {
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
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tabs.map((tab) => {
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
          {!loading && !error && activeTab === 'reservations' ? <ReservationsPanel rows={dataset.reservations} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'messages' ? <MessagesPanel rows={dataset.messages} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'menu' ? <MenuCrudPanel /> : null}
          {!loading && !error && activeTab === 'orders' ? <OrdersPanel rows={dataset.orders} refresh={refresh} /> : null}
          {!loading && !error && activeTab === 'reports' ? <ReportsPanel dataset={dataset} /> : null}
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
      .then((sessionUser) => setUser(isAdminUser(sessionUser) ? sessionUser : null))
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
