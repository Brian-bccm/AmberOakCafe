import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDateTime } from './formatters.js'

function orderRows(report) {
  return report.rows.orders.map((order) => ({
    Date: formatDateTime(order.created_at),
    Customer: order.customer_name,
    Phone: order.phone,
    Status: order.status,
    Payment: order.payment_status || 'unpaid',
    Revenue: Number(order.subtotal || 0),
  }))
}

function paymentRows(report) {
  return (report.rows.payments || []).map((payment) => ({
    Date: formatDateTime(payment.payment_date),
    Customer: payment.customer_name,
    Method: payment.payment_method,
    Status: payment.payment_status,
    Reference: payment.transaction_reference || '-',
    Amount: Number(payment.amount || 0),
  }))
}

export function exportReportToPdf(report) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(`Amber & Oak Cafe - ${report.title}`, 14, 18)
  doc.setFontSize(11)
  doc.text(`Revenue: ${formatCurrency(report.analytics.totalRevenue)}`, 14, 30)
  doc.text(`Orders: ${report.analytics.totalOrders}`, 14, 38)
  doc.text(`Customers: ${report.analytics.totalCustomers}`, 14, 46)

  autoTable(doc, {
    startY: 56,
    head: [['Date', 'Customer', 'Method', 'Status', 'Reference', 'Amount']],
    body: paymentRows(report).map((row) => [row.Date, row.Customer, row.Method, row.Status, row.Reference, formatCurrency(row.Amount)]),
  })

  doc.save(`amber-oak-${report.range}-report.pdf`)
}

function toCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}

export function exportReportToExcel(report) {
  const rows = [
    { Section: 'Summary', Metric: 'Total revenue', Value: report.analytics.totalRevenue },
    { Section: 'Summary', Metric: 'Total orders', Value: report.analytics.totalOrders },
    { Section: 'Summary', Metric: 'Total customers', Value: report.analytics.totalCustomers },
    { Section: 'Summary', Metric: 'Reservations', Value: report.analytics.reservationsTotal },
    { Section: 'Summary', Metric: 'Pending payment amount', Value: report.analytics.pendingAmount },
    ...paymentRows(report).map((row) => ({ Section: 'Payments', Metric: `${row.Customer} (${row.Method} / ${row.Status})`, Value: row.Amount })),
    ...orderRows(report).map((row) => ({ Section: 'Orders', Metric: `${row.Customer} (${row.Payment})`, Value: row.Revenue })),
    ...report.analytics.topSellingItems.map((item) => ({ Section: 'Top Items', Metric: item.name, Value: item.quantity })),
  ]
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `amber-oak-${report.range}-report.csv`
  link.click()
  URL.revokeObjectURL(url)
}
