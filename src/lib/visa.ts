import crypto from 'crypto'
import fs from 'fs'
import https from 'https'

type VisaJsonResponse<T> = {
  status: number
  body: T
  rawBody: string
}

function readSecret({
  inline,
  path,
  label,
}: {
  inline?: string
  path?: string
  label: string
}) {
  if (inline?.trim()) {
    return inline.replace(/\\n/g, '\n')
  }

  if (path?.trim()) {
    return fs.readFileSync(path, 'utf8')
  }

  throw new Error(`${label} is not configured`)
}

function buildXPayToken({
  resourcePath,
  queryString,
  requestBody,
}: {
  resourcePath: string
  queryString: string
  requestBody: string
}) {
  const sharedSecret = process.env.VISA_SHARED_SECRET
  if (!sharedSecret) {
    throw new Error('VISA_SHARED_SECRET is not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const payload = `${timestamp}${resourcePath}${queryString}${requestBody}`
  const digest = crypto.createHmac('sha256', sharedSecret).update(payload).digest('hex')

  return `xv2:${timestamp}:${digest}`
}

export function hasVisaClickToPayConfig() {
  return Boolean(
    process.env.VISA_API_BASE_URL &&
      process.env.VISA_API_KEY &&
      process.env.VISA_SHARED_SECRET &&
      (process.env.VISA_CLIENT_CERT_PEM || process.env.VISA_CLIENT_CERT_PATH) &&
      (process.env.VISA_CLIENT_KEY_PEM || process.env.VISA_CLIENT_KEY_PATH),
  )
}

export async function visaRequest<TResponse>({
  resourcePath,
  body,
  method = 'POST',
}: {
  resourcePath: string
  body?: unknown
  method?: 'GET' | 'POST'
}): Promise<VisaJsonResponse<TResponse>> {
  const baseUrl = process.env.VISA_API_BASE_URL
  const apiKey = process.env.VISA_API_KEY

  if (!baseUrl) throw new Error('VISA_API_BASE_URL is not configured')
  if (!apiKey) throw new Error('VISA_API_KEY is not configured')

  const requestBody = body ? JSON.stringify(body) : ''
  const queryString = `apikey=${encodeURIComponent(apiKey)}`
  const cleanResourcePath = resourcePath.replace(/^\//, '')
  const signedResourcePath = `/${cleanResourcePath}`
  const requestUrl = new URL(`/${cleanResourcePath}?${queryString}`, baseUrl)
  const xPayToken = buildXPayToken({
    resourcePath: signedResourcePath,
    queryString,
    requestBody,
  })

  const cert = readSecret({
    inline: process.env.VISA_CLIENT_CERT_PEM,
    path: process.env.VISA_CLIENT_CERT_PATH,
    label: 'Visa client certificate',
  })
  const key = readSecret({
    inline: process.env.VISA_CLIENT_KEY_PEM,
    path: process.env.VISA_CLIENT_KEY_PATH,
    label: 'Visa client private key',
  })
  const ca = process.env.VISA_CA_BUNDLE_PEM || process.env.VISA_CA_BUNDLE_PATH
    ? readSecret({
        inline: process.env.VISA_CA_BUNDLE_PEM,
        path: process.env.VISA_CA_BUNDLE_PATH,
        label: 'Visa CA bundle',
      })
    : undefined

  return new Promise((resolve, reject) => {
    const req = https.request(
      requestUrl,
      {
        method,
        cert,
        key,
        ca,
        passphrase: process.env.VISA_CLIENT_KEY_PASSPHRASE || undefined,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'x-pay-token': xPayToken,
        },
      },
      (res) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let parsed: unknown = null
          try {
            parsed = text ? JSON.parse(text) : null
          } catch {
            parsed = { message: text }
          }
          resolve({ status: res.statusCode ?? 0, body: parsed as TResponse, rawBody: text })
        })
      },
    )

    req.on('error', reject)
    if (requestBody) req.write(requestBody)
    req.end()
  })
}
