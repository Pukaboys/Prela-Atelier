import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  ApiError,
} from '@paypal/paypal-server-sdk'

function getClient() {
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID ?? '',
      oAuthClientSecret: process.env.PAYPAL_SECRET ?? '',
    },
    environment:
      process.env.PAYPAL_API_BASE?.includes('sandbox')
        ? Environment.Sandbox
        : Environment.Production,
  })
}

export async function createPayPalOrder(totalEur: number): Promise<string> {
  const controller = new OrdersController(getClient())
  const { result } = await controller.createOrder({
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'EUR',
            value: totalEur.toFixed(2),
          },
        },
      ],
    },
  })
  if (!result.id) throw new Error('PayPal create order failed: no order ID')
  return result.id
}

export async function capturePayPalOrder(orderId: string): Promise<{ status: string; amount: string }> {
  const controller = new OrdersController(getClient())
  try {
    const { result } = await controller.captureOrder({
      id: orderId,
      prefer: 'return=representation',
    })
    const amount =
      result.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value ?? '0'
    return { status: result.status ?? 'UNKNOWN', amount }
  } catch (err) {
    if (err instanceof ApiError) {
      console.error('[paypal/capture] status:', err.statusCode)
      console.error('[paypal/capture] body:', JSON.stringify(err.body, null, 2))
    }
    throw err
  }
}
