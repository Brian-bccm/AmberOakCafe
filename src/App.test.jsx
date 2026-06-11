import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import App from './App.jsx'

describe('Amber & Oak Cafe landing page', () => {
  test('renders the required restaurant sections and primary calls to action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Amber & Oak Cafe/i })).toBeInTheDocument()
    const navigation = screen.getByRole('navigation', { name: /Primary navigation/i })
    expect(navigation).toBeInTheDocument()

    for (const section of ['About', 'Menu', 'Gallery', 'Special Offer', 'Location', 'Contact']) {
      expect(within(navigation).getByRole('link', { name: section })).toBeInTheDocument()
    }

    expect(screen.getByText(/Signature Menu/i)).toBeInTheDocument()
    expect(screen.getByText(/Truffle Mushroom Toast/i)).toBeInTheDocument()
    expect(screen.getByText(/RM 28/i)).toBeInTheDocument()
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

    await user.type(screen.getByLabelText(/Name/i), 'Aina Rahman')
    await user.type(screen.getByLabelText(/Phone/i), '012-345 6789')
    await user.type(screen.getByLabelText(/Message/i), 'I would like to reserve a table for four this Saturday.')
    await user.click(screen.getByRole('button', { name: /Send Enquiry/i }))

    expect(screen.getByText(/Thanks, Aina. Your enquiry is ready/i)).toBeInTheDocument()
  })
})
