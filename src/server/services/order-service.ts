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

type OrderFormInput = Pick<
  CheckoutInput,
  'name' | 'email' | 'address' | 'city' | 'postcode' | 'country'
> & {
  phone?: string | null
  notes?: string | null
}

export function getCustomerOrderNotes(order: OrderWithNotes) {
  const clean = (order.notes ?? '')
    .replace(PRODUCTION_METADATA_PATTERN, '')
    .replace(/\[\[inventory_applied:[^\]]+\]\]/g, '')
    .trim()
  return clean.length > 0 ? clean : null
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
  } = {},
) {
  const cleanNotes = getCustomerOrderNotes({ notes: customerNotes })
  const inventoryAppliedAt = extractInventoryAppliedAt(customerNotes)
  const inventoryToken = inventoryAppliedAt ? buildInventoryAppliedToken(inventoryAppliedAt) : null
  const metadataTokens = buildProductionMetadataTokens({
    existingNotes: customerNotes,
    stage: productionStage,
    priority: options.productionPriority,
    eventAt: options.eventAt,
  })
  const tokens = [...metadataTokens, inventoryToken].filter(Boolean).join('\n\n')

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
      priceEur: DecimalLike
      subtotal: DecimalLike
    }>
  },
>(order: TOrder) {
  const production = buildProductionManagementSummary(order)

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
        notes: buildOrderNotes(form.notes || null, 'Design'),
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
