import { BarChart3, LogOut, MessageSquare, ReceiptText, Settings, Utensils, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import { fetchContactMessages, fetchOrders, fetchReservations, updateMessageStatus, updateOrderStatus, updateReservationStatus } from '../../services/adminService.js'
import { getSessionUser, isAdminUser, signInAdmin, signOutAdmin } from '../../services/authService.js'
import { createMenuItem, deleteMenuItem, fetchAdminMenuItems, updateMenuItem } from '../../services/menuService.js'
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
  is_available: true,
  display_order: 0,
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
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#b7791f" radius={[8, 8, 0, 0]} />
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
    </div>
  )
}

function ReservationsPanel({ rows, refresh }) {
  const update = async (id, status) => {
    await updateReservationStatus(id, status)
    refresh()
  }

  return (
    <DataTable
      title="Reservations management"
      rows={rows}
      headers={['Date', 'Customer', 'Phone', 'Guests', 'Status', 'Action']}
      render={(row) => [
        `${formatDate(row.reservation_date)} ${row.reservation_time}`,
        row.customer_name,
        row.phone,
        row.guests,
        row.status,
        <StatusSelect key={row.id} value={row.status} options={['pending', 'confirmed', 'cancelled', 'completed']} onChange={(value) => update(row.id, value)} />,
      ]}
    />
  )
}

function MessagesPanel({ rows, refresh }) {
  const update = async (id, status) => {
    await updateMessageStatus(id, status)
    refresh()
  }

  return (
    <DataTable
      title="Contact messages management"
      rows={rows}
      headers={['Date', 'Name', 'Phone', 'Message', 'Status', 'Action']}
      render={(row) => [
        formatDateTime(row.created_at),
        row.name,
        row.phone,
        row.message,
        row.status,
        <StatusSelect key={row.id} value={row.status} options={['new', 'read', 'replied', 'archived']} onChange={(value) => update(row.id, value)} />,
      ]}
    />
  )
}

function OrdersPanel({ rows, refresh }) {
  const update = async (id, status) => {
    await updateOrderStatus(id, status)
    refresh()
  }

  return (
    <DataTable
      title="Orders management"
      rows={rows}
      headers={['Date', 'Customer', 'Items', 'Revenue', 'Status', 'Action']}
      render={(row) => [
        formatDateTime(row.created_at),
        row.customer_name,
        (row.order_items || []).map((item) => `${item.quantity}x ${item.item_name}`).join(', ') || '-',
        formatCurrency(row.subtotal),
        row.status,
        <StatusSelect key={row.id} value={row.status} options={['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']} onChange={(value) => update(row.id, value)} />,
      ]}
    />
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
    setForm({ ...emptyMenuForm, ...item, price: item.price ?? '' })
  }

  const remove = async (id) => {
    await deleteMenuItem(id)
    await load()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl">{editingId ? 'Edit menu item' : 'Add menu item'}</h2>
        <div className="mt-5 grid gap-4">
          {['name', 'description', 'price', 'category', 'tag', 'image_url', 'display_order'].map((field) => (
            <input key={field} name={field} value={form[field] ?? ''} onChange={change} className="focus-ring rounded-lg border border-stone-300 bg-cafe-cream px-4 py-3" placeholder={field.replace('_', ' ')} />
          ))}
          <label className="inline-flex items-center gap-3 text-sm font-bold">
            <input type="checkbox" name="is_available" checked={form.is_available} onChange={change} />
            Available on public menu
          </label>
        </div>
        <button className="focus-ring mt-5 rounded-full bg-cafe-ink px-6 py-3 text-sm font-bold text-white">Save Menu Item</button>
        {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyMenuForm) }} className="ml-3 text-sm font-bold text-cafe-copper">Cancel</button> : null}
        {status ? <p className="mt-4 rounded-lg bg-cafe-cream px-4 py-3 text-sm">{status}</p> : null}
      </form>

      <DataTable
        title="Menu items"
        rows={items}
        headers={['Name', 'Category', 'Price', 'Available', 'Actions']}
        render={(item) => [
          item.name,
          item.category,
          formatCurrency(item.price),
          item.is_available ? 'Yes' : 'No',
          <span key={item.id} className="inline-flex gap-2">
            <button onClick={() => edit(item)} className="font-bold text-cafe-copper">Edit</button>
            <button onClick={() => remove(item.id)} className="font-bold text-red-700">Delete</button>
          </span>,
        ]}
      />
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
          <select value={activeTab} onChange={(event) => setActiveTab(event.target.value)} className="mt-4 w-full rounded-lg border border-stone-300 px-4 py-3">
            {tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
          </select>
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
  if (!user) return <AdminLogin onLogin={setUser} />

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />
}

export default AdminApp
