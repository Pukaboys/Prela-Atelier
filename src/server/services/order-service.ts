import prisma from '@/lib/db'
import { buildOrderItemName } from '@/lib/cart'
import { calculateShipping, generateOrderCode, getCurrencyFormatOptions } from '@/lib/helpers'
import {
  PRODUCTION_METADATA_PATTERN,
  type ProductionStage,
  type ProductionPriority,
  buildProductionManagementSummary,
  buildProductionMetadataTokens,
  getProductionStageIndex,
  getProductionStageFromOrder,
} from '@/lib/production-workflow'
import { getSettings } from '@/lib/settings'
import { sendOrderConfirmation } from '@/lib/mailer'
import {
  applyInventoryForConfirmedOrder,
  buildInventoryAppliedToken,
  extractInventoryAppliedAt,
  assertCartInventoryAvailable,
} from '@/server/services/inventory-service'
import type { AppliedPromo, CartItem } from '@/types'
import type {
  CheckoutInput,
  OrderStatusInput,
} from '@/server/validations/order'
import { toNumber, type DecimalLike } from '@/server/utils/money'

type OrderWithNotes = {
  notes?: string | null
  status?: string | null
  createdAt?: string | Date | null
}

const PAYMENT_REFERENCE_PATTERN = /\[\[payment_reference:[^\]]+\]\]/g

type OrderFormInput = Pick<
  CheckoutInput,
  'name' | 'email' | 'address' | 'city' | 'postcode' | 'country'
> & {
  phone?: string | null
  notes?: string | null
}

export const STALE_PENDING_ORDER_DAYS = 3

function getStalePendingOrderCutoff() {
  return new Date(Date.now() - STALE_PENDING_ORDER_DAYS * 24 * 60 * 60 * 1000)
}

export async function moveStalePendingOrdersToTrash() {
  return prisma.order.updateMany({
    where: {
      status: 'pending',
      createdAt: { lt: getStalePendingOrderCutoff() },
    },
    data: {
      status: 'cancelled',
    },
  })
}

export function getCustomerOrderNotes(order: OrderWithNotes) {
  const clean = (order.notes ?? '')
    .replace(PRODUCTION_METADATA_PATTERN, '')
    .replace(/\[\[inventory_applied:[^\]]+\]\]/g, '')
    .replace(PAYMENT_REFERENCE_PATTERN, '')
    .trim()
  return clean.length > 0 ? clean : null
}

function buildPaymentReferenceToken(paymentReference?: string | null) {
  return paymentReference ? `[[payment_reference:${paymentReference}]]` : null
}

function buildPaymentReferenceLockId(paymentReference: string) {
  let hash = 0
  for (const char of paymentReference) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return hash
}

function isEnquiryCustomOrder(notes?: string | null) {
  return /\[\[payment_reference:bespoke(?::|-bank:)/.test(notes ?? '')
}

export function getProductionStage(order: OrderWithNotes): ProductionStage {
  return getProductionStageFromOrder(order)
}

export function buildOrderNotes(
  customerNotes?: string | null,
  productionStage: ProductionStage = 'Design',
  options: {
    productionPriority?: ProductionPriority
    eventAt?: string
    paymentReference?: string
  } = {},
) {
  const cleanNotes = getCustomerOrderNotes({ notes: customerNotes })
  const inventoryAppliedAt = extractInventoryAppliedAt(customerNotes)
  const inventoryToken = inventoryAppliedAt ? buildInventoryAppliedToken(inventoryAppliedAt) : null
  const paymentReferenceToken = buildPaymentReferenceToken(options.paymentReference)
  const metadataTokens = buildProductionMetadataTokens({
    existingNotes: customerNotes,
    stage: productionStage,
    priority: options.productionPriority,
    eventAt: options.eventAt,
  })
  const tokens = [...metadataTokens, inventoryToken, paymentReferenceToken].filter(Boolean).join('\n\n')

  return cleanNotes ? `${cleanNotes}\n\n${tokens}` : tokens
}

function toSerializableOrder<
  TOrder extends {
    subtotal: DecimalLike
    shipping: DecimalLike
    total: DecimalLike
    discount: DecimalLike
    notes?: string | null
    status?: string | null
    createdAt?: string | Date | null
    items: Array<{
      productId?: number | null
      name?: string | null
      priceEur: DecimalLike
      subtotal: DecimalLike
    }>
  },
>(order: TOrder) {
  const production = buildProductionManagementSummary(order)
  const isCustomOrder = isEnquiryCustomOrder(order.notes)

  return {
    ...order,
    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.shipping),
    total: toNumber(order.total),
    discount: toNumber(order.discount),
    notes: getCustomerOrderNotes(order),
    productionStage: getProductionStage(order),
    productionPriority: production.priority,
    production,
    orderLabel: isCustomOrder ? 'Custom' : null,
    items: order.items.map((item) => ({
      ...item,
      priceEur: toNumber(item.priceEur),
      subtotal: toNumber(item.subtotal),
    })),
  }
}

export function buildOrderEmailItems(cart: CartItem[]) {
  return cart.map((item) => ({
    name: buildOrderItemName(item),
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))
}

export async function calculateOrderAmounts({
  country,
  cart,
  appliedPromo,
}: {
  country: string
  cart: CartItem[]
  appliedPromo?: AppliedPromo
}) {
  const settings = await getSettings()
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedPromo?.discount ?? 0
  const shipping = calculateShipping(subtotal, country, {
    freeThreshold: Number(settings.shipping_free_threshold),
    euRate: Number(settings.shipping_eu_rate),
    intlRate: Number(settings.shipping_intl_rate),
  })
  const total = Math.max(0, subtotal + shipping - discount)

  return {
    settings,
    subtotal,
    discount,
    shipping,
    total,
  }
}

export async function createConfirmedOrder({
  form,
  cart,
  appliedPromo,
  paymentReference,
}: {
  form: OrderFormInput
  cart: CartItem[]
  appliedPromo?: AppliedPromo
  paymentReference?: string
}) {
  const { settings, subtotal, discount, shipping, total } = await calculateOrderAmounts({
    country: form.country,
    cart,
    appliedPromo,
  })
  const orderCode = generateOrderCode()
  let finalOrderCode = orderCode
  let created = true

  await prisma.$transaction(async (tx) => {
    const paymentReferenceToken = buildPaymentReferenceToken(paymentReference)
    if (paymentReference && paymentReferenceToken) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${buildPaymentReferenceLockId(paymentReference)})`

      const existing = await tx.order.findFirst({
        where: { notes: { contains: paymentReferenceToken } },
        select: { orderCode: true },
      })

      if (existing) {
        finalOrderCode = existing.orderCode
        created = false
        return
      }
    }

    await assertCartInventoryAvailable(cart, tx)

    const order = await tx.order.create({
      data: {
        orderCode,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        subtotal,
        shipping,
        total,
        status: 'confirmed',
        notes: buildOrderNotes(form.notes || null, 'Design', { paymentReference }),
        promoCode: appliedPromo?.code ?? null,
        discount,
      },
    })

    await tx.orderItem.createMany({
      data: cart.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        name: buildOrderItemName(item),
        priceEur: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    })

    if (appliedPromo?.code) {
      await tx.promoCode.update({
        where: { code: appliedPromo.code },
        data: { usedCount: { increment: 1 } },
      })
    }

    await applyInventoryForConfirmedOrder(order.id, tx)
  })

  return {
    orderCode: finalOrderCode,
    created,
    subtotal,
    shipping,
    discount,
    total,
    settings,
    emailItems: buildOrderEmailItems(cart),
  }
}

export async function createConfirmedCustomOrder({
  form,
  title,
  description,
  amountEur,
  paymentReference,
}: {
  form: OrderFormInput
  title: string
  description?: string | null
  amountEur: number
  paymentReference?: string
}) {
  const settings = await getSettings()
  const subtotal = Math.round(amountEur * 100) / 100
  const shipping = 0
  const discount = 0
  const total = subtotal
  const orderCode = generateOrderCode()
  let finalOrderCode = orderCode
  let created = true

  await prisma.$transaction(async (tx) => {
    const paymentReferenceToken = buildPaymentReferenceToken(paymentReference)
    if (paymentReference && paymentReferenceToken) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${buildPaymentReferenceLockId(paymentReference)})`

      const existing = await tx.order.findFirst({
        where: { notes: { contains: paymentReferenceToken } },
        select: { orderCode: true },
      })

      if (existing) {
        finalOrderCode = existing.orderCode
        created = false
        return
      }
    }

    const order = await tx.order.create({
      data: {
        orderCode,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        subtotal,
        shipping,
        total,
        status: 'confirmed',
        notes: buildOrderNotes(
          [form.notes, description, 'Custom / Bespoke order'].filter(Boolean).join('\n\n'),
          'Design',
          { paymentReference },
        ),
        discount,
        items: {
          create: [{
            productId: null,
            name: `Custom / Bespoke - ${title}`,
            priceEur: subtotal,
            quantity: 1,
            subtotal,
          }],
        },
      },
    })

    await applyInventoryForConfirmedOrder(order.id, tx)
  })

  return {
    orderCode: finalOrderCode,
    created,
    subtotal,
    shipping,
    discount,
    total,
    settings,
    emailItems: [{
      name: `Custom / Bespoke - ${title}`,
      quantity: 1,
      subtotal,
    }],
  }
}

export async function createPendingCustomOrder({
  form,
  title,
  description,
  amountEur,
  paymentReference,
}: {
  form: OrderFormInput
  title: string
  description?: string | null
  amountEur: number
  paymentReference?: string
}) {
  const settings = await getSettings()
  const subtotal = Math.round(amountEur * 100) / 100
  const shipping = 0
  const discount = 0
  const total = subtotal
  const orderCode = generateOrderCode()
  let finalOrderCode = orderCode
  let created = true

  await prisma.$transaction(async (tx) => {
    const paymentReferenceToken = buildPaymentReferenceToken(paymentReference)
    if (paymentReference && paymentReferenceToken) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${buildPaymentReferenceLockId(paymentReference)})`

      const existing = await tx.order.findFirst({
        where: { notes: { contains: paymentReferenceToken } },
        select: { orderCode: true },
      })

      if (existing) {
        finalOrderCode = existing.orderCode
        created = false
        return
      }
    }

    await tx.order.create({
      data: {
        orderCode,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        subtotal,
        shipping,
        total,
        status: 'pending',
        notes: buildOrderNotes(
          [form.notes, description, 'Custom / Bespoke order', 'Awaiting bank transfer'].filter(Boolean).join('\n\n'),
          'Design',
          { paymentReference },
        ),
        discount,
        items: {
          create: [{
            productId: null,
            name: `Custom / Bespoke - ${title}`,
            priceEur: subtotal,
            quantity: 1,
            subtotal,
          }],
        },
      },
    })
  })

  return {
    orderCode: finalOrderCode,
    created,
    subtotal,
    shipping,
    discount,
    total,
    settings,
    emailItems: [{
      name: `Custom / Bespoke - ${title}`,
      quantity: 1,
      subtotal,
    }],
  }
}

export async function createPendingBankTransferOrder({
  form,
  cart,
  appliedPromo,
}: {
  form: OrderFormInput
  cart: CartItem[]
  appliedPromo?: AppliedPromo
}) {
  const { settings, subtotal, discount, shipping, total } = await calculateOrderAmounts({
    country: form.country,
    cart,
    appliedPromo,
  })
  const orderCode = generateOrderCode()

  await prisma.$transaction(async (tx) => {
    await assertCartInventoryAvailable(cart, tx)

    await tx.order.create({
      data: {
        orderCode,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        address: form.address,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        subtotal,
        shipping,
        total,
        status: 'pending',
        notes: buildOrderNotes(form.notes || null, 'Design'),
        promoCode: appliedPromo?.code ?? null,
        discount,
        items: {
          create: cart.map((item) => ({
            productId: item.productId,
            name: buildOrderItemName(item),
            priceEur: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
        },
      },
    })

    if (appliedPromo?.code) {
      await tx.promoCode.update({
        where: { code: appliedPromo.code },
        data: { usedCount: { increment: 1 } },
      })
    }
  })

  return {
    orderCode,
    subtotal,
    shipping,
    discount,
    total,
    settings,
    emailItems: buildOrderEmailItems(cart),
  }
}

export async function listOrdersForAdmin() {
  await moveStalePendingOrdersToTrash()

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          priceEur: true,
          subtotal: true,
        },
      },
    },
  })

  return orders.map((order) => toSerializableOrder(order))
}

export async function updateOrderStatus(orderId: number, status: OrderStatusInput) {
  let sendConfirmation = false

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, notes: true },
    })

    if (!existing) {
      return null
    }

    const nextStage = getProductionStage(existing)
    const shouldMarkReady =
      status === 'shipped' && getProductionStageIndex(nextStage) < getProductionStageIndex('Ready')
    const notes =
      status === 'delivered'
        ? buildOrderNotes(existing.notes, 'Delivered')
        : shouldMarkReady
          ? buildOrderNotes(existing.notes, 'Ready')
          : undefined

    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(notes ? { notes } : {}),
      },
    })

    if (status === 'confirmed' && existing.status !== 'confirmed') {
      await applyInventoryForConfirmedOrder(orderId, tx)
      sendConfirmation = true
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
  })

  if (!order) {
    return null
  }

  if (sendConfirmation) {
    const settings = await getSettings()
    await sendOrderConfirmation({
      to: order.customerEmail,
      customerName: order.customerName,
      orderCode: order.orderCode,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        subtotal: toNumber(item.subtotal),
      })),
      shipping: toNumber(order.shipping),
      total: toNumber(order.total),
      currencyOptions: getCurrencyFormatOptions(settings),
    })
  }

  return toSerializableOrder(order)
}
export async function updateProductionStage(orderId: number, stage: ProductionStage) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, notes: true },
  })

  if (!existing) {
    return null
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      notes: buildOrderNotes(existing.notes, stage),
      ...(stage === 'Delivered' ? { status: 'delivered' } : {}),
    },
    include: { items: true },
  })

  return toSerializableOrder(order)
}

export async function updateProductionPriority(orderId: number, priority: ProductionPriority) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, notes: true },
  })

  if (!existing) {
    return null
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      notes: buildOrderNotes(existing.notes, getProductionStage(existing), {
        productionPriority: priority,
      }),
    },
    include: { items: true },
  })

  return toSerializableOrder(order)
}
