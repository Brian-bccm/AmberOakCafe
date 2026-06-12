import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App.jsx'
import { calculateAnalytics } from './services/reportService.js'
import { buildWhatsAppLink } from './utils/whatsapp.js'

describe('Amber & Oak Cafe landing page', () => {
  test('renders the required restaurant sections and primary calls to action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Amber & Oak Cafe/i })).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', { name: /Primary navigation/i })
    expect(navigation).toBeInTheDocument()

    for (const section of ['About', 'Menu', 'Order', 'Gallery', 'Special Offer', 'Reserve', 'Location', 'Contact']) {
      expect(within(navigation).getByRole('link', { name: section })).toBeInTheDocument()
    }

    expect(screen.getByText(/Signature Menu/i)).toBeInTheDocument()
    expect(screen.getByText(/Order Enquiry/i)).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /Reservation form/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Truffle Mushroom Toast/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/RM\s*28/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Weekend Brunch Set/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Jalan Telawi, Bangsar/i).length).toBeGreaterThan(0)

    const whatsappLinks = screen.getAllByRole('link', { name: /WhatsApp/i })
    expect(whatsappLinks[0]).toHaveAttribute('href', expect.stringContaining('wa.me/60123456789'))
  })

  test('validates and confirms the contact form without leaving the page', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }))
    expect(screen.getByText(/Please complete your name, phone, and message/i)).toBeInTheDocument()

    const form = screen.getByRole('form', { name: /Contact form/i })
    await user.type(within(form).getByLabelText(/Name/i), 'Aina Rahman')
    await user.type(within(form).getByLabelText(/Phone/i), '012-345 6789')
    await user.type(within(form).getByLabelText(/Message/i), 'I would like to ask about private event catering.')
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }))

    expect(await screen.findByText(/Thanks, Aina/i)).toBeInTheDocument()
  })

  test('validates and confirms the reservation form in demo mode', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Request Reservation/i }))
    expect(screen.getByText(/Please add your name, phone, date, and time/i)).toBeInTheDocument()

    const form = screen.getByRole('form', { name: /Reservation form/i })
    await user.type(within(form).getByLabelText(/^Name$/i), 'Brian Tan')
    await user.type(within(form).getByLabelText(/^Phone$/i), '012-111 2222')
    await user.type(within(form).getByLabelText(/^Date$/i), '2026-07-10')
    await user.type(within(form).getByLabelText(/^Time$/i), '19:00')
    await user.click(screen.getByRole('button', { name: /Request Reservation/i }))

    expect(await screen.findByText(/Demo reservation captured locally/i)).toBeInTheDocument()
  })

  test('builds wa.me links with encoded customer messages', () => {
    const link = buildWhatsAppLink('+60 12-345 6789', 'Hi Amber & Oak Cafe, I want to order.')

    expect(link).toContain('https://wa.me/60123456789')
    expect(link).toContain('Hi%20Amber%20%26%20Oak%20Cafe')
  })

  test('calculates analytics from orders, customers, reservations, and messages', () => {
    const analytics = calculateAnalytics({
      reservations: [{ phone: '012', status: 'confirmed' }],
      messages: [{ phone: '013', status: 'new' }],
      orders: [
        {
          id: 'order-1',
          phone: '012',
          status: 'completed',
          payment_status: 'Paid',
          subtotal: 88,
          created_at: '2026-06-01T10:00:00Z',
          order_items: [{ item_name: 'Latte', quantity: 2, line_total: 32 }],
        },
      ],
      payments: [{ order_id: 'order-1', payment_status: 'Paid', amount: 88, payment_date: '2026-06-01T10:00:00Z' }],
    })

    expect(analytics.totalRevenue).toBe(88)
    expect(analytics.totalOrders).toBe(1)
    expect(analytics.totalCustomers).toBe(2)
    expect(analytics.topSellingItems[0].name).toBe('Latte')
  })
})
