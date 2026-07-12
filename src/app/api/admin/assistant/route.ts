import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { getAdminAssistantContext } from '@/server/services/admin-ai-context-service'

const requestSchema = z.object({
  message: z.string().min(1).max(1200),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(1500),
  })).max(8).optional().default([]),
})

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['open_order', 'open_product', 'open_enquiry', 'none'] },
          label: { type: 'string' },
          href: { type: 'string' },
          id: { type: ['number', 'null'] },
          code: { type: ['string', 'null'] },
        },
        required: ['type', 'label', 'href', 'id', 'code'],
      },
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['answer', 'actions', 'suggestions'],
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== 'object') return ''
  const direct = (data as { output_text?: unknown }).output_text
  if (typeof direct === 'string') return direct

  const output = (data as { output?: unknown }).output
  if (!Array.isArray(output)) return ''

  return output
    .flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const content = (item as { content?: unknown }).content
      return Array.isArray(content) ? content : []
    })
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const text = (part as { text?: unknown }).text
      return typeof text === 'string' ? text : ''
    })
    .join('')
}

function fallbackActions(context: Awaited<ReturnType<typeof getAdminAssistantContext>>, message: string) {
  const q = message.toLowerCase()
  const actions = []

  const order = context.orders.find((item) =>
    item.orderCode.toLowerCase().includes(q) ||
    q.includes(item.orderCode.toLowerCase()) ||
    item.customerEmail.toLowerCase().includes(q) ||
    item.customerName.toLowerCase().includes(q) ||
    q.includes(item.customerEmail.toLowerCase()) ||
    q.includes(item.customerName.toLowerCase())
  )
  if (order) {
    actions.push({
      type: 'open_order',
      label: `Open order ${order.orderCode}`,
      href: `/admin/orders?order=${encodeURIComponent(order.orderCode)}`,
      id: order.id,
      code: order.orderCode,
    })
  }

  const product = context.products.find((item) =>
    item.name.toLowerCase().includes(q) ||
    item.slug.toLowerCase().includes(q) ||
    q.includes(item.name.toLowerCase()) ||
    q.includes(item.slug.toLowerCase())
  )
  if (product) {
    actions.push({
      type: 'open_product',
      label: `Open product ${product.name}`,
      href: `/admin/products?product=${encodeURIComponent(product.slug)}`,
      id: product.id,
      code: product.slug,
    })
  }

  const enquiry = context.enquiries.find((item) =>
    item.email.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    q.includes(item.email.toLowerCase()) ||
    q.includes(item.name.toLowerCase()) ||
    q.includes(String(item.id))
  )
  if (enquiry) {
    actions.push({
      type: 'open_enquiry',
      label: `Open enquiry from ${enquiry.name}`,
      href: `/admin/enquiries?enquiry=${enquiry.id}`,
      id: enquiry.id,
      code: String(enquiry.id),
    })
  }

  return actions.slice(0, 3)
}

function sanitizeActions(
  actions: Array<{ type: string; label: string; href: string; id: number | null; code: string | null }>,
) {
  return actions.filter((action) => {
    if (action.type === 'open_order') return action.href.startsWith('/admin/orders?order=')
    if (action.type === 'open_product') return action.href.startsWith('/admin/products?product=')
    if (action.type === 'open_enquiry') return action.href.startsWith('/admin/enquiries?enquiry=')
    return false
  })
}

export async function POST(request: NextRequest) {
  await requireAdmin()

  const parsed = requestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid question.' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured in Vercel.' }, { status: 503 })
  }

  const context = await getAdminAssistantContext()
  const model = process.env.OPENAI_ADMIN_ASSISTANT_MODEL ?? 'gpt-4.1-mini'
  const system = [
    'You are Prela Atelier Admin AI, a concise business assistant for the store owner.',
    'Use only the provided admin context. Do not invent orders, products, enquiries, totals, or dates.',
    'Help with analytics, operational decisions, inventory, customer enquiries, order lookup, and product lookup.',
    'When the user is searching for an order, product, or enquiry, include an action with the matching admin href.',
    'Return JSON only. Keep answer practical and direct.',
  ].join('\n')

  const input = [
    ...parsed.data.history.map((item) => `${item.role.toUpperCase()}: ${item.content}`),
    `USER: ${parsed.data.message}`,
    `ADMIN_CONTEXT_JSON: ${JSON.stringify(context)}`,
  ].join('\n\n')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: system,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'admin_assistant_response',
          schema: responseSchema,
          strict: true,
        },
      },
      max_output_tokens: 900,
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    console.error('[admin/assistant] OpenAI error', data)
    return NextResponse.json({ error: 'The AI assistant could not answer right now.' }, { status: 502 })
  }

  try {
    const text = extractOutputText(data)
    const result = JSON.parse(text) as { answer: string; actions: Array<{ type: string; label: string; href: string; id: number | null; code: string | null }>; suggestions: string[] }
    const cleanActions = sanitizeActions(result.actions)
    const mergedActions = cleanActions.length > 0 ? cleanActions : fallbackActions(context, parsed.data.message)
    return NextResponse.json({
      answer: result.answer,
      actions: mergedActions.slice(0, 4),
      suggestions: result.suggestions.slice(0, 4),
    })
  } catch (err) {
    console.error('[admin/assistant] parse error', err, data)
    return NextResponse.json({
      answer: 'I found the admin data, but could not format the AI response. Try asking again in a shorter way.',
      actions: fallbackActions(context, parsed.data.message),
      suggestions: ['Show me delayed orders', 'Which products need attention?', 'Find new enquiries'],
    })
  }
}
