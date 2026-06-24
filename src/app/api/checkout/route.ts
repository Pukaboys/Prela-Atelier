import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { normalizeCartItems } from '@/lib/cart'
import { sendBankTransferInstructions, sendNewOrderAlert } from '@/lib/mailer'
import { getCurrencyFormatOptions } from '@/lib/helpers'
import { getDisplayCurrencyOptions } from '@/server/services/currency-service'
import { InventoryError } from '@/server/services/inventory-service'
import { createPendingBankTransferOrder } from '@/server/services/order-service'
import { checkoutSchema } from '@/server/validations/order'
import type { AppliedPromo, CartItem } from '@/types'
import {
  collectProductVariationMaterialIds,
  getProductVariationMaterialsMap,
  getStoredProductVariationConfigMap,
  resolveProductVariationSelection,
} from '@/server/services/product-variation-service'

type MobileCheckoutItem = {
  cartItemId?: string
  productId: number
  materialId?: number | null
  quantity: number
}

async function resolveMobileCart(items: MobileCheckoutItem[] | undefined): Promise<CartItem[]> {
  if (!items || items.length === 0) return []

  const quantities = new Map<string, MobileCheckoutItem>()
  for (const item of items) {
    const key = item.cartItemId ?? `${item.productId}:${item.materialId ?? 'base'}`
    const existing = quantities.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      quantities.set(key, { ...item, cartItemId: key })
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set([...quantities.values()].map((item) => item.productId))] } },
    select: {
      id: true,
      name: true,
      slug: true,
      priceEur: true,
      imagePath: true,
      materialId: true,
      material: {
        select: {
          id: true,
          name: true,
          origin: true,
          description: true,
          hardness: true,
          tone: true,
          veining: true,
          imagePath: true,
        },
      },
    },
  })

  if (products.length !== new Set([...quantities.values()].map((item) => item.productId)).size) {
    throw new Error('Some products in your cart are no longer available.')
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  const configMap = await getStoredProductVariationConfigMap(products.map((product) => product.id))
  const materialsById = await getProductVariationMaterialsMap(
    collectProductVariationMaterialIds(products, configMap),
  )

  return [...quantities.values()].map((item) => {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error('Some products in your cart are no longer available.')
    }

    const selection = resolveProductVariationSelection({
      productId: product.id,
      basePriceEUR: product.priceEur,
      productImagePath: product.imagePath ?? product.material?.imagePath ?? null,
      baseMaterialId: product.materialId,
      baseMaterial: product.material,
      storedConfig: configMap.get(product.id),
      materialsById,
      selectedMaterialId: item.materialId ?? null,
    }).selectedVariation

    return {
      cartItemId: item.cartItemId ?? `${product.id}:${selection?.materialId ?? product.materialId ?? 'base'}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: selection?.priceEUR ?? Number(product.priceEur),
      quantity: item.quantity,
      imagePath: selection?.images[0] ?? product.imagePath ?? product.material?.imagePath ?? null,
      materialId: selection?.materialId ?? product.materialId ?? null,
      materialName: selection?.materialName ?? product.material?.name ?? null,
    }
  })
}

async function resolveRequestPromo(code: string | undefined, subtotal: number): Promise<AppliedPromo | undefined> {
  const normalizedCode = code?.trim().toUpperCase()
  if (!normalizedCode) return undefined

  const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } })

  if (!promo || !promo.active) {
    throw new Error('Invalid promo code')
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new Error('This promo code has expired')
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new Error('This promo code has reached its usage limit')
  }

  const minOrder = Number(promo.minOrder)
  if (subtotal < minOrder) {
    throw new Error(`Minimum order of EUR ${minOrder.toFixed(0)} required for this code`)
  }

  const value = Number(promo.value)
  const type = promo.type as AppliedPromo['type']
  const discount = type === 'percentage'
    ? Math.round((value / 100) * subtotal * 100) / 100
    : Math.min(value, subtotal)

  return { code: normalizedCode, type, value, discount }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? 'Invalid form data'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const session = await getSession()
    const mobileCart = await resolveMobileCart(parsed.data.items)
    const cart = session.cart?.length ? normalizeCartItems(session.cart) : mobileCart
    if (cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const form = parsed.data
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const requestPromo = await resolveRequestPromo(form.promoCode, subtotal)
    const order = await createPendingBankTransferOrder({
      form,
      cart,
      appliedPromo: session.appliedPromo ?? requestPromo,
    })

    session.cart = []
    session.appliedPromo = undefined
    await session.save()

    const customerCurrencyOptions = await getDisplayCurrencyOptions(order.settings)
    const adminCurrencyOptions = getCurrencyFormatOptions(order.settings)

    await Promise.allSettled([
      sendBankTransferInstructions({
        to: form.email,
        customerName: form.name,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        currencyOptions: customerCurrencyOptions,
        bankAccountName: order.settings.bank_account_name,
        bankIban: order.settings.bank_iban,
        bankName: order.settings.bank_name,
      }),
      sendNewOrderAlert({
        customerName: form.name,
        customerEmail: form.email,
        orderCode: order.orderCode,
        items: order.emailItems,
        shipping: order.shipping,
        total: order.total,
        currencyOptions: adminCurrencyOptions,
      }),
    ])

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      total: order.total,
      currency: form.currency,
      data: {
        orderCode: order.orderCode,
        total: order.total,
        currency: form.currency,
      },
    })
  } catch (err) {
    if (err instanceof InventoryError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    if (
      err instanceof Error &&
      (
        err.message.includes('promo code') ||
        err.message.includes('usage limit') ||
        err.message.includes('Minimum order')
      )
    ) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }

    if (err instanceof Error && err.message.includes('products in your cart')) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
