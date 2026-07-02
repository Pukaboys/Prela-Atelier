import type { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { getSetting } from '@/lib/settings'
import type { CartItem } from '@/types'

const INVENTORY_LOG_KEY = 'inventory_log'
const INVENTORY_LOW_STOCK_THRESHOLD_KEY = 'inventory_low_stock_threshold'
const INVENTORY_LOG_LIMIT = 150

export const DEFAULT_LOW_STOCK_THRESHOLD = 3
export const INVENTORY_APPLIED_PATTERN = /\[\[inventory_applied:([^\]]+)\]\]/g

type InventoryDbClient = typeof prisma | Prisma.TransactionClient

type CartInventoryItem = Pick<CartItem, 'productId' | 'quantity' | 'name'>

export type InventoryStockLevel = 'healthy' | 'low' | 'out'

export type InventoryAvailabilityIssue = {
  productId: number
  productName: string
  requested: number
  available: number
}

type InventoryLogEntry = {
  id: string
  createdAt: string
  type: 'stock-deduction'
  productId: number
  productName: string
  quantity: number
  stockBefore: number
  stockAfter: number
  orderId: number
  orderCode: string
}

export class InventoryError extends Error {
  issues: InventoryAvailabilityIssue[]

  constructor(message: string, issues: InventoryAvailabilityIssue[]) {
    super(message)
    this.name = 'InventoryError'
    this.issues = issues
  }
}

function parsePositiveInteger(value: string | null | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function buildInventoryError(issues: InventoryAvailabilityIssue[]) {
  if (issues.length === 1) {
    const issue = issues[0]
    return new InventoryError(
      `Insufficient stock for ${issue.productName}. Requested ${issue.requested}, available ${issue.available}.`,
      issues,
    )
  }

  return new InventoryError(
    'Some items in this order no longer have enough stock available.',
    issues,
  )
}

function parseInventoryLog(raw: string | null | undefined) {
  if (!raw) return [] as InventoryLogEntry[]

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as InventoryLogEntry[]) : []
  } catch {
    return []
  }
}

async function appendInventoryLog(
  entries: InventoryLogEntry[],
  client: InventoryDbClient = prisma,
) {
  if (entries.length === 0) return

  const existing = await client.setting.findUnique({
    where: { key: INVENTORY_LOG_KEY },
    select: { value: true },
  })

  const nextLog = [...parseInventoryLog(existing?.value), ...entries].slice(-INVENTORY_LOG_LIMIT)

  await client.setting.upsert({
    where: { key: INVENTORY_LOG_KEY },
    create: {
      key: INVENTORY_LOG_KEY,
      value: JSON.stringify(nextLog),
    },
    update: {
      value: JSON.stringify(nextLog),
    },
  })
}

export async function getInventoryLowStockThreshold() {
  const raw = await getSetting(INVENTORY_LOW_STOCK_THRESHOLD_KEY)
  return parsePositiveInteger(raw, DEFAULT_LOW_STOCK_THRESHOLD)
}

export function getInventoryStockLevel(
  stock: number,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
): InventoryStockLevel {
  if (stock <= 0) return 'out'
  if (stock < lowStockThreshold) return 'low'
  return 'healthy'
}

export function extractInventoryAppliedAt(notes?: string | null) {
  if (!notes) return null

  const matches = [...notes.matchAll(INVENTORY_APPLIED_PATTERN)]
  return matches.at(-1)?.[1] ?? null
}

export function buildInventoryAppliedToken(appliedAt: string) {
  return `[[inventory_applied:${appliedAt}]]`
}

export function appendInventoryAppliedToken(notes?: string | null, appliedAt?: string | null) {
  if (!appliedAt) return notes ?? null
  if (extractInventoryAppliedAt(notes)) return notes ?? null

  const token = buildInventoryAppliedToken(appliedAt)
  const cleanNotes = (notes ?? '').trim()
  return cleanNotes ? `${cleanNotes}\n\n${token}` : token
}

export async function assertCartInventoryAvailable(
  cart: CartInventoryItem[],
  client: InventoryDbClient = prisma,
) {
  if (cart.length === 0) return

  const aggregatedRequests = new Map<number, CartInventoryItem>()
  for (const item of cart) {
    const existing = aggregatedRequests.get(item.productId)
    if (existing) {
      existing.quantity += item.quantity
      if (!existing.name && item.name) existing.name = item.name
    } else {
      aggregatedRequests.set(item.productId, { ...item })
    }
  }

  const products = await client.product.findMany({
    where: {
      id: {
        in: [...aggregatedRequests.keys()],
      },
    },
    select: {
      id: true,
      name: true,
      stock: true,
    },
  })

  const productMap = new Map(products.map((product) => [product.id, product]))
  const issues: InventoryAvailabilityIssue[] = []

  for (const item of aggregatedRequests.values()) {
    const product = productMap.get(item.productId)

    if (!product) {
      issues.push({
        productId: item.productId,
        productName: item.name,
        requested: item.quantity,
        available: 0,
      })
      continue
    }

    if (product.stock < item.quantity) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        requested: item.quantity,
        available: product.stock,
      })
    }
  }

  if (issues.length > 0) {
    throw buildInventoryError(issues)
  }
}

export async function applyInventoryForConfirmedOrder(
  orderId: number,
  client: InventoryDbClient = prisma,
) {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      notes: true,
      items: {
        select: {
          productId: true,
          name: true,
          quantity: true,
        },
      },
    },
  })

  if (!order) return null

  const existingAppliedAt = extractInventoryAppliedAt(order.notes)
  if (existingAppliedAt) {
    return {
      applied: false,
      appliedAt: existingAppliedAt,
    }
  }

  if (order.items.length === 0) {
    return {
      applied: false,
      appliedAt: null,
    }
  }

  const inventoryItems = order.items.filter((item): item is typeof item & { productId: number } => item.productId != null)

  if (inventoryItems.length === 0) {
    return {
      applied: false,
      appliedAt: null,
    }
  }

  await assertCartInventoryAvailable(
    inventoryItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      name: item.name,
    })),
    client,
  )

  const products = await client.product.findMany({
    where: {
      id: {
        in: [...new Set(inventoryItems.map((item) => item.productId))],
      },
    },
    select: {
      id: true,
      name: true,
      stock: true,
    },
  })

  const productMap = new Map(products.map((product) => [product.id, { ...product }]))
  const logEntries: InventoryLogEntry[] = []

  for (const item of inventoryItems) {
    const product = productMap.get(item.productId)

    if (!product) {
      throw buildInventoryError([
        {
          productId: item.productId,
          productName: item.name,
          requested: item.quantity,
          available: 0,
        },
      ])
    }

    const updated = await client.product.updateMany({
      where: {
        id: item.productId,
        stock: { gte: item.quantity },
      },
      data: {
        stock: { decrement: item.quantity },
      },
    })

    if (updated.count !== 1) {
      const latest = await client.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      })

      throw buildInventoryError([
        {
          productId: item.productId,
          productName: latest?.name ?? item.name,
          requested: item.quantity,
          available: latest?.stock ?? 0,
        },
      ])
    }

    logEntries.push({
      id: `${Date.now()}-${item.productId}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      type: 'stock-deduction',
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      stockBefore: product.stock,
      stockAfter: Math.max(product.stock - item.quantity, 0),
      orderId: order.id,
      orderCode: order.orderCode,
    })

    product.stock = Math.max(product.stock - item.quantity, 0)
  }

  const appliedAt = new Date().toISOString()

  await client.order.update({
    where: { id: order.id },
    data: {
      notes: appendInventoryAppliedToken(order.notes, appliedAt),
    },
  })

  await appendInventoryLog(logEntries, client)

  return {
    applied: true,
    appliedAt,
  }
}
