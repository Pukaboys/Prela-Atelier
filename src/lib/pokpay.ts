type PokLoginResponse = {
  statusCode: number
  data?: {
    accessToken?: string
    expiresAt?: string
    tokenType?: string
  }
  message?: string
}

type PokSdkOrder = {
  id: string
  amount: number
  currencyCode: string
  shippingCost?: number
  finalAmount: number
  isCompleted?: boolean
  isCanceled?: boolean
  isRefunded?: boolean
  redirectUrl?: string | null
  failRedirectUrl?: string | null
  merchantCustomReference?: string | null
  transactionId?: string | null
  _self?: {
    confirmUrl?: string
    confirmDeeplink?: string
  }
}

type PokOrderResponse = {
  statusCode: number
  data?: {
    sdkOrder?: PokSdkOrder
  }
  message?: string
  errors?: Array<{ message?: string }>
}

type PokToken = {
  accessToken: string
  expiresAt: number
}

let cachedToken: PokToken | null = null

function getPokBaseUrl() {
  return process.env.POKPAY_API_BASE ?? 'https://api.pokpay.io'
}

function getPokConfig() {
  const keyId = process.env.POKPAY_KEY_ID
  const keySecret = process.env.POKPAY_KEY_SECRET
  const merchantId = process.env.POKPAY_MERCHANT_ID

  if (!keyId || !keySecret || !merchantId) {
    throw new Error('POK Pay is not configured')
  }

  return { keyId, keySecret, merchantId }
}

function assertPokSuccess(response: { statusCode: number; message?: string; errors?: Array<{ message?: string }> }) {
  if (response.statusCode >= 200 && response.statusCode < 300) return

  const errorMessage = response.errors?.find((error) => error.message)?.message
  throw new Error(errorMessage ?? response.message ?? 'POK Pay request failed')
}

async function getPokAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const { keyId, keySecret } = getPokConfig()
  const res = await fetch(`${getPokBaseUrl()}/auth/sdk/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId, keySecret }),
  })
  const data = (await res.json()) as PokLoginResponse
  assertPokSuccess(data)

  const accessToken = data.data?.accessToken
  if (!accessToken) {
    throw new Error('POK Pay did not return an access token')
  }

  cachedToken = {
    accessToken,
    expiresAt: data.data?.expiresAt ? new Date(data.data.expiresAt).getTime() : Date.now() + 50 * 60_000,
  }

  return accessToken
}

async function pokRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getPokAccessToken()
  const res = await fetch(`${getPokBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  })

  const data = (await res.json()) as T & { statusCode: number; message?: string; errors?: Array<{ message?: string }> }
  assertPokSuccess(data)
  return data
}

export type CreatePokOrderInput = {
  amount: number
  shippingCost: number
  currencyCode: string
  description: string
  redirectUrl: string
  failRedirectUrl: string
  merchantCustomReference: string
  products?: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export async function createPokOrder(input: CreatePokOrderInput) {
  const { merchantId } = getPokConfig()
  const data = await pokRequest<PokOrderResponse>(`/merchants/${merchantId}/sdk-orders`, {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      currencyCode: input.currencyCode,
      autoCapture: true,
      shippingCost: input.shippingCost,
      webhookUrl: process.env.POKPAY_WEBHOOK_URL || undefined,
      redirectUrl: input.redirectUrl,
      failRedirectUrl: input.failRedirectUrl,
      description: input.description,
      merchantCustomReference: input.merchantCustomReference,
      products: input.products,
      expiresAfterMinutes: 1440,
    }),
  })

  const sdkOrder = data.data?.sdkOrder
  const confirmUrl = sdkOrder?._self?.confirmUrl
  if (!sdkOrder?.id || !confirmUrl) {
    throw new Error('POK Pay did not return a payment URL')
  }

  return { sdkOrder, confirmUrl }
}

export async function retrievePokOrder(sdkOrderId: string) {
  const { merchantId } = getPokConfig()
  const data = await pokRequest<PokOrderResponse>(
    `/merchants/${merchantId}/sdk-orders/${sdkOrderId}?loadTransaction=true`,
  )

  const sdkOrder = data.data?.sdkOrder
  if (!sdkOrder) {
    throw new Error('POK Pay order was not found')
  }

  return sdkOrder
}
