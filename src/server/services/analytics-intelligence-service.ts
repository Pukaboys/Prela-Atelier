import prisma from '@/lib/db'
import { toNumber, type DecimalLike } from '@/server/utils/money'

const REVENUE_STATUSES = new Set(['confirmed', 'shipped', 'delivered'])
const RECENT_PRODUCT_DAYS = 30
const SLOW_MOVING_DAYS = 90

type IntelligenceOrder = {
  id: number
  orderCode: string
  customerName: string
  customerEmail: string
  total: DecimalLike
  status: string
  createdAt: Date
  items: Array<{
    productId: number
    name: string
    quantity: number
    subtotal: DecimalLike
  }>
}

type IntelligenceProduct = {
  id: number
  name: string
  slug: string
  stock: number
  priceEur: DecimalLike
  createdAt: Date
}

type CustomerAggregate = {
  name: string
  email: string
  orderCount: number
  totalSpend: number
  averageOrderValue: number
  lastOrderDate: string
}

type ProductSalesAggregate = {
  id: number
  label: string
  unitsSold: number
  recentUnitsSold: number
  slowWindowUnitsSold: number
  revenue: number
  lastSoldAt: Date | null
}

export type AnalyticsIntelligence = {
  revenuePrediction: {
    method: string
    next30DaysRevenue: number
    nextMonthRevenue: number
    baselineMonthlyRevenue: number
    trendDelta: number
    trend: 'growing' | 'stable' | 'declining'
    confidence: 'Low' | 'Medium' | 'High'
  }
  likelyBestSellers: Array<{
    id: number
    label: string
    unitsSold: number
    recentUnitsSold: number
    revenue: number
    demandScore: number
    reason: string
  }>
  slowMovingProducts: Array<{
    id: number
    label: string
    slug: string
    stock: number
    unitsSold: number
    recentUnitsSold: number
    daysSinceLastSale: number | null
    riskLevel: 'Low' | 'Medium' | 'High'
    recommendation: string
  }>
  highValueCustomers: CustomerAggregate[]
  customerSegments: {
    totalCustomers: number
    vipThreshold: number
    vip: CustomerSegmentSummary
    frequentBuyers: CustomerSegmentSummary
    oneTimeBuyers: CustomerSegmentSummary
  }
}

type CustomerSegmentSummary = {
  count: number
  revenue: number
  averageSpend: number
  examples: CustomerAggregate[]
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function daysBetween(start: Date, end = new Date()) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000))
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))
  return sorted[index]
}

function buildMonthlyRevenue(orders: IntelligenceOrder[], months = 6) {
  const now = new Date()
  const buckets = new Map<string, number>()

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = startOfMonth(new Date(now.getFullYear(), now.getMonth() - index, 1))
    buckets.set(monthKey(date), 0)
  }

  for (const order of orders) {
    if (!REVENUE_STATUSES.has(order.status)) continue

    const key = monthKey(startOfMonth(order.createdAt))
    if (!buckets.has(key)) continue

    buckets.set(key, roundCurrency((buckets.get(key) ?? 0) + toNumber(order.total)))
  }

  return Array.from(buckets.values())
}

function linearRegressionSlope(values: number[]) {
  if (values.length < 2) return 0

  const n = values.length
  const xAverage = (n - 1) / 2
  const yAverage = values.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let denominator = 0

  values.forEach((value, index) => {
    numerator += (index - xAverage) * (value - yAverage)
    denominator += (index - xAverage) ** 2
  })

  return denominator === 0 ? 0 : numerator / denominator
}

function buildRevenuePrediction(orders: IntelligenceOrder[]): AnalyticsIntelligence['revenuePrediction'] {
  const monthlyRevenue = buildMonthlyRevenue(orders)
  const recentMonths = monthlyRevenue.slice(-3)
  const baselineMonthlyRevenue =
    recentMonths.length > 0
      ? recentMonths.reduce((sum, revenue) => sum + revenue, 0) / recentMonths.length
      : 0
  const slope = linearRegressionSlope(monthlyRevenue)
  const projected = Math.max(0, baselineMonthlyRevenue + slope)
  const activeMonths = monthlyRevenue.filter((revenue) => revenue > 0).length
  const average =
    monthlyRevenue.length > 0
      ? monthlyRevenue.reduce((sum, revenue) => sum + revenue, 0) / monthlyRevenue.length
      : 0
  const variance =
    monthlyRevenue.length > 0
      ? monthlyRevenue.reduce((sum, revenue) => sum + (revenue - average) ** 2, 0) / monthlyRevenue.length
      : 0
  const volatility = average > 0 ? Math.sqrt(variance) / average : 1
  const confidence = activeMonths >= 5 && volatility < 0.7 ? 'High' : activeMonths >= 3 ? 'Medium' : 'Low'
  const trendThreshold = Math.max(baselineMonthlyRevenue * 0.08, 50)
  const trend =
    slope > trendThreshold ? 'growing' : slope < -trendThreshold ? 'declining' : 'stable'

  return {
    method: 'Six-month revenue history with three-month moving average and linear trend',
    next30DaysRevenue: roundCurrency(projected),
    nextMonthRevenue: roundCurrency(projected),
    baselineMonthlyRevenue: roundCurrency(baselineMonthlyRevenue),
    trendDelta: roundCurrency(slope),
    trend,
    confidence,
  }
}

function aggregateProductSales(orders: IntelligenceOrder[]) {
  const recentStart = daysAgo(RECENT_PRODUCT_DAYS)
  const slowWindowStart = daysAgo(SLOW_MOVING_DAYS)
  const map = new Map<number, ProductSalesAggregate>()

  for (const order of orders) {
    if (order.status === 'cancelled') continue

    for (const item of order.items) {
      const existing = map.get(item.productId) ?? {
        id: item.productId,
        label: item.name,
        unitsSold: 0,
        recentUnitsSold: 0,
        slowWindowUnitsSold: 0,
        revenue: 0,
        lastSoldAt: null,
      }

      existing.unitsSold += item.quantity
      existing.revenue = roundCurrency(existing.revenue + toNumber(item.subtotal))

      if (order.createdAt >= recentStart) {
        existing.recentUnitsSold += item.quantity
      }

      if (order.createdAt >= slowWindowStart) {
        existing.slowWindowUnitsSold += item.quantity
      }

      if (!existing.lastSoldAt || order.createdAt > existing.lastSoldAt) {
        existing.lastSoldAt = order.createdAt
      }

      map.set(item.productId, existing)
    }
  }

  return map
}

function buildLikelyBestSellers(
  productSales: Map<number, ProductSalesAggregate>,
): AnalyticsIntelligence['likelyBestSellers'] {
  return Array.from(productSales.values())
    .map((product) => {
      const daysSinceLastSale = product.lastSoldAt ? daysBetween(product.lastSoldAt) : 180
      const recencyBoost = Math.max(0, 30 - daysSinceLastSale)
      const demandScore =
        product.unitsSold * 1.2 +
        product.recentUnitsSold * 3 +
        product.revenue / 150 +
        recencyBoost * 0.6

      const reason =
        product.recentUnitsSold > 0
          ? `${product.recentUnitsSold} unit${product.recentUnitsSold === 1 ? '' : 's'} sold in the last ${RECENT_PRODUCT_DAYS} days`
          : 'Strong historical sales performance'

      return {
        id: product.id,
        label: product.label,
        unitsSold: product.unitsSold,
        recentUnitsSold: product.recentUnitsSold,
        revenue: product.revenue,
        demandScore: roundScore(demandScore),
        reason,
      }
    })
    .sort((left, right) => right.demandScore - left.demandScore)
    .slice(0, 5)
}

function buildSlowMovingProducts(
  products: IntelligenceProduct[],
  productSales: Map<number, ProductSalesAggregate>,
): AnalyticsIntelligence['slowMovingProducts'] {
  const slowStart = daysAgo(SLOW_MOVING_DAYS)

  return products
    .map((product) => {
      const sales = productSales.get(product.id)
      const recentUnitsSold =
        sales?.lastSoldAt && sales.lastSoldAt >= slowStart ? sales.slowWindowUnitsSold : 0
      const daysSinceLastSale = sales?.lastSoldAt ? daysBetween(sales.lastSoldAt) : null
      const noSalesPenalty = sales ? 0 : 120
      const stalePenalty = daysSinceLastSale ?? daysBetween(product.createdAt)
      const slowScore = noSalesPenalty + stalePenalty + product.stock * 4 - recentUnitsSold * 30
      const riskLevel: AnalyticsIntelligence['slowMovingProducts'][number]['riskLevel'] =
        product.stock > 0 && (!sales || recentUnitsSold === 0 || slowScore >= 120)
          ? 'High'
          : slowScore >= 60
            ? 'Medium'
            : 'Low'
      const recommendation =
        riskLevel === 'High'
          ? 'Feature in merchandising, bundle with best sellers, or review pricing.'
          : riskLevel === 'Medium'
            ? 'Monitor demand and consider a homepage or collection placement.'
            : 'Healthy movement based on current sales history.'

      return {
        id: product.id,
        label: product.name,
        slug: product.slug,
        stock: product.stock,
        unitsSold: sales?.unitsSold ?? 0,
        recentUnitsSold,
        daysSinceLastSale,
        riskLevel,
        recommendation,
        slowScore,
      }
    })
    .filter((product) => product.stock > 0 && product.riskLevel !== 'Low')
    .sort((left, right) => right.slowScore - left.slowScore)
    .slice(0, 5)
    .map(({ slowScore: _slowScore, ...product }) => product)
}

function aggregateCustomers(orders: IntelligenceOrder[]) {
  const map = new Map<string, CustomerAggregate>()

  for (const order of orders) {
    if (!REVENUE_STATUSES.has(order.status)) continue

    const key = order.customerEmail.trim().toLowerCase()
    const existing = map.get(key) ?? {
      name: order.customerName,
      email: order.customerEmail,
      orderCount: 0,
      totalSpend: 0,
      averageOrderValue: 0,
      lastOrderDate: order.createdAt.toISOString(),
    }

    existing.orderCount += 1
    existing.totalSpend = roundCurrency(existing.totalSpend + toNumber(order.total))
    existing.averageOrderValue = roundCurrency(existing.totalSpend / existing.orderCount)

    if (new Date(existing.lastOrderDate) < order.createdAt) {
      existing.lastOrderDate = order.createdAt.toISOString()
      existing.name = order.customerName
      existing.email = order.customerEmail
    }

    map.set(key, existing)
  }

  return Array.from(map.values()).sort(
    (left, right) => right.totalSpend - left.totalSpend || right.orderCount - left.orderCount,
  )
}

function summarizeSegment(customers: CustomerAggregate[]): CustomerSegmentSummary {
  const revenue = roundCurrency(customers.reduce((sum, customer) => sum + customer.totalSpend, 0))

  return {
    count: customers.length,
    revenue,
    averageSpend: customers.length > 0 ? roundCurrency(revenue / customers.length) : 0,
    examples: customers
      .sort((left, right) => right.totalSpend - left.totalSpend)
      .slice(0, 3),
  }
}

function buildCustomerSegments(customers: CustomerAggregate[]): AnalyticsIntelligence['customerSegments'] {
  const spends = customers.map((customer) => customer.totalSpend)
  const maxSpend = Math.max(...spends, 0)
  const percentileThreshold = percentile(spends, 0.75)
  const vipThreshold = maxSpend >= 1000 ? Math.max(1000, percentileThreshold) : percentileThreshold
  const vip = customers.filter((customer) => customer.totalSpend >= vipThreshold && vipThreshold > 0)
  const vipEmails = new Set(vip.map((customer) => customer.email.toLowerCase()))
  const frequentBuyers = customers.filter(
    (customer) => customer.orderCount >= 2 && !vipEmails.has(customer.email.toLowerCase()),
  )
  const oneTimeBuyers = customers.filter(
    (customer) => customer.orderCount === 1 && !vipEmails.has(customer.email.toLowerCase()),
  )

  return {
    totalCustomers: customers.length,
    vipThreshold: roundCurrency(vipThreshold),
    vip: summarizeSegment(vip),
    frequentBuyers: summarizeSegment(frequentBuyers),
    oneTimeBuyers: summarizeSegment(oneTimeBuyers),
  }
}

export async function getAnalyticsIntelligence(): Promise<AnalyticsIntelligence> {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        customerEmail: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            name: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        priceEur: true,
        createdAt: true,
      },
    }),
  ])

  const typedOrders = orders as IntelligenceOrder[]
  const typedProducts = products as IntelligenceProduct[]
  const productSales = aggregateProductSales(typedOrders)
  const customers = aggregateCustomers(typedOrders)

  return {
    revenuePrediction: buildRevenuePrediction(typedOrders),
    likelyBestSellers: buildLikelyBestSellers(productSales),
    slowMovingProducts: buildSlowMovingProducts(typedProducts, productSales),
    highValueCustomers: customers.slice(0, 5),
    customerSegments: buildCustomerSegments(customers),
  }
}
