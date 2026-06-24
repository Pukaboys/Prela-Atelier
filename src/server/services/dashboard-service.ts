import prisma from '@/lib/db'
import { toNumber } from '@/server/utils/money'
import { getAnalyticsIntelligence } from '@/server/services/analytics-intelligence-service'

const REVENUE_STATUSES = new Set(['confirmed', 'shipped', 'delivered'])
const ORDER_STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const

type DashboardOrder = {
  id: number
  orderCode: string
  customerName: string
  total: number | string | { toNumber(): number }
  status: string
  createdAt: Date
}

type DailyMonthlyPoint = {
  label: string
  revenue: number
  orders: number
}

type RankingItem = {
  label: string
  quantity: number
  revenue: number
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 1000) / 10
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }

  return Math.round((((current - previous) / previous) * 100) * 10) / 10
}

function buildDailySeries(orders: DashboardOrder[], days = 14): DailyMonthlyPoint[] {
  const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
  const series = new Map<string, DailyMonthlyPoint>()
  const today = startOfDay(new Date())

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    series.set(dayKey(date), {
      label: formatter.format(date),
      revenue: 0,
      orders: 0,
    })
  }

  for (const order of orders) {
    const key = dayKey(startOfDay(new Date(order.createdAt)))
    const bucket = series.get(key)

    if (!bucket) continue

    bucket.orders += 1
    if (REVENUE_STATUSES.has(order.status)) {
      bucket.revenue = Math.round((bucket.revenue + toNumber(order.total)) * 100) / 100
    }
  }

  return Array.from(series.values())
}

function buildMonthlySeries(orders: DashboardOrder[], months = 12): DailyMonthlyPoint[] {
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' })
  const series = new Map<string, DailyMonthlyPoint>()
  const now = new Date()

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    series.set(monthKey(date), {
      label: formatter.format(date),
      revenue: 0,
      orders: 0,
    })
  }

  for (const order of orders) {
    const createdAt = new Date(order.createdAt)
    const key = monthKey(new Date(createdAt.getFullYear(), createdAt.getMonth(), 1))
    const bucket = series.get(key)

    if (!bucket) continue

    bucket.orders += 1
    if (REVENUE_STATUSES.has(order.status)) {
      bucket.revenue = Math.round((bucket.revenue + toNumber(order.total)) * 100) / 100
    }
  }

  return Array.from(series.values())
}

function summarizeSeriesTrend(points: DailyMonthlyPoint[], splitIndex: number) {
  const previous = points.slice(0, splitIndex).reduce((sum, point) => sum + point.orders, 0)
  const current = points.slice(splitIndex).reduce((sum, point) => sum + point.orders, 0)

  return {
    current,
    previous,
    changePercent: percentChange(current, previous),
  }
}

function buildOrderStatusBreakdown(orders: DashboardOrder[]) {
  const counts = new Map<string, number>()

  for (const status of ORDER_STATUS_ORDER) {
    counts.set(status, 0)
  }

  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
  }

  return ORDER_STATUS_ORDER.map((status) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: counts.get(status) ?? 0,
  }))
}

function buildTopProducts(
  items: Array<{
    productId: number
    name: string
    quantity: number
    subtotal: number | string | { toNumber(): number }
    order: { status: string }
  }>,
  limit = 5,
) {
  const map = new Map<number, RankingItem>()

  for (const item of items) {
    if (item.order.status === 'cancelled') continue

    const existing = map.get(item.productId) ?? {
      label: item.name,
      quantity: 0,
      revenue: 0,
    }

    existing.quantity += item.quantity
    existing.revenue = Math.round((existing.revenue + toNumber(item.subtotal)) * 100) / 100
    map.set(item.productId, existing)
  }

  return Array.from(map.values())
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, limit)
}

function buildTopMaterials(
  items: Array<{
    quantity: number
    subtotal: number | string | { toNumber(): number }
    order: { status: string }
    product: { material: { id: number; name: string } | null }
  }>,
  limit = 5,
) {
  const map = new Map<string, RankingItem>()

  for (const item of items) {
    if (item.order.status === 'cancelled') continue

    const label = item.product.material?.name ?? 'Unassigned'
    const existing = map.get(label) ?? {
      label,
      quantity: 0,
      revenue: 0,
    }

    existing.quantity += item.quantity
    existing.revenue = Math.round((existing.revenue + toNumber(item.subtotal)) * 100) / 100
    map.set(label, existing)
  }

  return Array.from(map.values())
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, limit)
}

function buildConversionMetrics(
  orders: DashboardOrder[],
  enquiries: Array<{ createdAt: Date }>,
) {
  const now = new Date()
  const recentStart = new Date(now)
  recentStart.setDate(now.getDate() - 30)

  const totalOrders = orders.length
  const totalEnquiries = enquiries.length
  const recentOrders = orders.filter((order) => new Date(order.createdAt) >= recentStart).length
  const recentEnquiries = enquiries.filter((enquiry) => new Date(enquiry.createdAt) >= recentStart).length

  return {
    totalOrders,
    totalEnquiries,
    totalOrderShare: percent(totalOrders, totalOrders + totalEnquiries),
    totalOrdersPerEnquiry:
      totalEnquiries > 0 ? Math.round((totalOrders / totalEnquiries) * 100) / 100 : null,
    recentOrders,
    recentEnquiries,
    recentOrderShare: percent(recentOrders, recentOrders + recentEnquiries),
    recentOrdersPerEnquiry:
      recentEnquiries > 0 ? Math.round((recentOrders / recentEnquiries) * 100) / 100 : null,
  }
}

export async function getAdminDashboardOverview() {
  const [totalProducts, orders, enquiries, orderItems, intelligence] = await Promise.all([
    prisma.product.count(),
    prisma.order.findMany({
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bespokeEnquiry.findMany({
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.orderItem.findMany({
      select: {
        productId: true,
        name: true,
        quantity: true,
        subtotal: true,
        order: {
          select: {
            status: true,
          },
        },
        product: {
          select: {
            material: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    getAnalyticsIntelligence(),
  ])

  const pendingOrders = orders.filter((order) => order.status === 'pending').length
  const newEnquiries = enquiries.filter((enquiry) => enquiry.status === 'new').length
  const confirmedRevenue = orders
    .filter((order) => REVENUE_STATUSES.has(order.status))
    .reduce((sum, order) => sum + toNumber(order.total), 0)

  const dailySeries = buildDailySeries(orders)
  const monthlySeries = buildMonthlySeries(orders)
  const recentOrders = orders.slice(0, 5).map((order) => ({
    ...order,
    total: toNumber(order.total),
  }))

  return {
    stats: {
      totalProducts,
      totalOrders: orders.length,
      pendingOrders,
      newEnquiries,
      confirmedRevenue: Math.round(confirmedRevenue * 100) / 100,
    },
    analytics: {
      revenue: {
        daily: dailySeries,
        monthly: monthlySeries,
      },
      orderTrend: {
        daily: summarizeSeriesTrend(dailySeries, Math.floor(dailySeries.length / 2)),
        monthly: summarizeSeriesTrend(monthlySeries, Math.floor(monthlySeries.length / 2)),
      },
      topProducts: buildTopProducts(orderItems),
      topMaterials: buildTopMaterials(orderItems),
      orderStatusBreakdown: buildOrderStatusBreakdown(orders),
      conversion: buildConversionMetrics(orders, enquiries),
    },
    intelligence,
    recentOrders,
  }
}
