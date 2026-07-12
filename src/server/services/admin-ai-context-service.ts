import prisma from '@/lib/db'
import { getAdminDashboardOverview } from '@/server/services/dashboard-service'
import { listOrdersForAdmin } from '@/server/services/order-service'
import { toNumber } from '@/server/utils/money'

const MAX_ORDERS = 60
const MAX_PRODUCTS = 80
const MAX_ENQUIRIES = 60

export async function getAdminAssistantContext() {
  const [dashboard, orders, products, enquiries] = await Promise.all([
    getAdminDashboardOverview(),
    listOrdersForAdmin(),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_PRODUCTS,
      select: {
        id: true,
        name: true,
        slug: true,
        priceEur: true,
        stock: true,
        featured: true,
        badge: true,
        material: { select: { name: true } },
        createdAt: true,
      },
    }),
    prisma.bespokeEnquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX_ENQUIRIES,
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        budget: true,
        status: true,
        timeline: true,
        description: true,
        createdAt: true,
      },
    }),
  ])

  return {
    generatedAt: new Date().toISOString(),
    dashboard,
    orders: orders.slice(0, MAX_ORDERS).map((order) => ({
      id: order.id,
      orderCode: order.orderCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      status: order.status,
      productionStage: order.productionStage,
      productionPriority: order.productionPriority,
      orderLabel: order.orderLabel,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    })),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceEur: toNumber(product.priceEur),
      stock: product.stock,
      featured: product.featured,
      badge: product.badge,
      material: product.material?.name ?? null,
      createdAt: product.createdAt,
    })),
    enquiries: enquiries.map((enquiry) => ({
      ...enquiry,
      description: enquiry.description.slice(0, 600),
    })),
  }
}
