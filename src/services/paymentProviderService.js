export const paymentProviders = [
  { id: 'manual', label: 'Manual payment tracking', liveGateway: false },
  { id: 'stripe', label: 'Stripe', liveGateway: true },
  { id: 'billplz', label: 'Billplz', liveGateway: true },
  { id: 'senangpay', label: 'SenangPay', liveGateway: true },
  { id: 'toyyibpay', label: 'ToyyibPay', liveGateway: true },
  { id: 'ipay88', label: 'iPay88', liveGateway: true },
]

export function getPaymentProvider(providerId = 'manual') {
  return paymentProviders.find((provider) => provider.id === providerId) || paymentProviders[0]
}

export async function createPaymentIntent({ providerId = 'manual', order }) {
  const provider = getPaymentProvider(providerId)

  if (provider.id === 'manual') {
    return {
      provider: provider.id,
      mode: 'manual',
      status: 'manual_tracking',
      message: 'Manual payment is enabled. Staff records payment status after cash, transfer, card terminal, or QR confirmation.',
      orderId: order?.id || null,
    }
  }

  return {
    provider: provider.id,
    mode: 'placeholder',
    status: 'not_configured',
    message: `${provider.label} requires a backend function for secret keys and payment callbacks before live payment collection can be enabled.`,
    orderId: order?.id || null,
  }
}
