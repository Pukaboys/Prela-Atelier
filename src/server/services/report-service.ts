import prisma from '@/lib/db'
import { toNumber, type DecimalLike } from '@/server/utils/money'

export const REPORT_TYPES = ['sales', 'orders', 'clients', 'materials'] as const
export const REPORT_FORMATS = ['csv', 'pdf'] as const

export type ReportType = typeof REPORT_TYPES[number]
export type ReportFormat = typeof REPORT_FORMATS[number]
export type ReportFilters = {
  from: Date | null
  to: Date | null
  fromValue: string | null
  toValue: string | null
}

type ReportRow = Record<string, string | number | null>

type ReportDocument = {
  title: string
  subtitle: string
  summary: string[]
  headers: string[]
  rows: ReportRow[]
}

type OrderForReports = {
  orderCode: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  city: string
  postcode: string
  country: string
  subtotal: DecimalLike
  shipping: DecimalLike
  total: DecimalLike
  discount: DecimalLike
  status: string
  promoCode: string | null
  createdAt: Date
  items: Array<{
    name: string
    quantity: number
    priceEur: DecimalLike
    subtotal: DecimalLike
    product: {
      material: {
        name: string
        origin: string
      } | null
    } | null
  }>
}

type ClientAggregate = {
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  postcode: string | null
  country: string | null
  totalSpent: number
  orderCount: number
  orderCodes: string[]
  sources: string[]
  lastSeen: Date
}

const REVENUE_STATUSES = new Set(['confirmed', 'shipped', 'delivered'])

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function csvRow(fields: Array<string | number | null | undefined>) {
  return fields
    .map((field) => {
      const value = field == null ? '' : String(field)
      return `"${value.replace(/"/g, '""')}"`
    })
    .join(',')
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDateInput(value: string | null | undefined, boundary: 'start' | 'end') {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const suffix = boundary === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z'
  const parsed = new Date(`${value}${suffix}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildReportFilters(
  fromValue: string | null | undefined,
  toValue: string | null | undefined,
): ReportFilters {
  const normalizedFromValue = fromValue?.trim() || null
  const normalizedToValue = toValue?.trim() || null
  let from = parseDateInput(normalizedFromValue, 'start')
  let to = parseDateInput(normalizedToValue, 'end')
  let nextFromValue = normalizedFromValue
  let nextToValue = normalizedToValue

  if (from && to && from > to) {
    ;[from, to] = [to, from]
    ;[nextFromValue, nextToValue] = [normalizedToValue, normalizedFromValue]
  }

  return {
    from,
    to,
    fromValue: nextFromValue,
    toValue: nextToValue,
  }
}

function buildCreatedAtWhere(filters: ReportFilters) {
  if (!filters.from && !filters.to) return undefined

  return {
    createdAt: {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    },
  }
}

function formatReportRange(filters: ReportFilters) {
  if (filters.fromValue && filters.toValue) {
    return `${filters.fromValue} to ${filters.toValue}`
  }

  if (filters.fromValue) {
    return `from ${filters.fromValue}`
  }

  if (filters.toValue) {
    return `until ${filters.toValue}`
  }

  return 'all time'
}

function appendRangeSummary(summary: string[], filters: ReportFilters) {
  return [`Date range: ${formatReportRange(filters)}`, ...summary]
}

function money(value: DecimalLike | number) {
  return toNumber(value).toFixed(2)
}

function isReportType(value: string | null | undefined): value is ReportType {
  return REPORT_TYPES.includes(value as ReportType)
}

function isReportFormat(value: string | null | undefined): value is ReportFormat {
  return REPORT_FORMATS.includes(value as ReportFormat)
}

function makeFileName(type: ReportType, format: ReportFormat, filters: ReportFilters) {
  const rangeSuffix = filters.fromValue || filters.toValue
    ? `-${filters.fromValue ?? 'start'}-${filters.toValue ?? 'end'}`
    : ''

  return `prela-${type}-report-${todayKey()}${rangeSuffix}.${format}`
}

function buildCsv(document: ReportDocument) {
  const header = csvRow(document.headers)
  const rows = document.rows.map((row) => csvRow(document.headers.map((header) => row[header])))
  return [header, ...rows].join('\r\n')
}

function sanitizePdfText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapLine(value: string, maxLength = 96) {
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxLength) {
      if (line) lines.push(line)
      line = word
    } else {
      line = next
    }
  }

  if (line) lines.push(line)
  return lines.length > 0 ? lines : ['']
}

function buildPdfLines(document: ReportDocument) {
  const lines = [
    document.title,
    document.subtitle,
    `Generated: ${new Date().toISOString()}`,
    '',
    ...document.summary,
    '',
    document.headers.join(' | '),
    '-'.repeat(110),
  ]

  for (const row of document.rows) {
    const text = document.headers
      .map((header) => `${header}: ${row[header] ?? ''}`)
      .join(' | ')

    lines.push(...wrapLine(text))
  }

  if (document.rows.length === 0) {
    lines.push('No data available for this report.')
  }

  return lines
}

function buildPdf(document: ReportDocument) {
  const lines = buildPdfLines(document)
  const linesPerPage = 42
  const pages: string[][] = []

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage))
  }

  const objects: string[] = []
  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = addObject('') // filled after page ids are known
  const pagesId = addObject('')
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>')
  const pageIds: number[] = []

  for (const pageLines of pages) {
    const streamLines = ['BT', '/F1 9 Tf', '50 790 Td']
    pageLines.forEach((line, index) => {
      if (index > 0) streamLines.push('0 -16 Td')
      streamLines.push(`(${sanitizePdfText(line)}) Tj`)
    })
    streamLines.push('ET')

    const stream = streamLines.join('\n')
    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`)
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageIds.push(pageId)
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF`

  return new Uint8Array(Buffer.from(pdf, 'utf8'))
}

async function getOrdersForReports(filters: ReportFilters) {
  return prisma.order.findMany({
    where: buildCreatedAtWhere(filters),
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              material: {
                select: {
                  name: true,
                  origin: true,
                },
              },
            },
          },
        },
      },
    },
  }) as Promise<OrderForReports[]>
}

async function buildSalesReport(filters: ReportFilters): Promise<ReportDocument> {
  const orders = await getOrdersForReports(filters)
  const revenueOrders = orders.filter((order) => REVENUE_STATUSES.has(order.status))
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + toNumber(order.total), 0)
  const totalDiscount = revenueOrders.reduce((sum, order) => sum + toNumber(order.discount), 0)
  const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0

  return {
    title: 'Sales Report',
    subtitle: 'Confirmed, shipped, and delivered order revenue',
    summary: appendRangeSummary([
      `Revenue orders: ${revenueOrders.length}`,
      `Gross revenue EUR: ${totalRevenue.toFixed(2)}`,
      `Discounts EUR: ${totalDiscount.toFixed(2)}`,
      `Average order value EUR: ${averageOrderValue.toFixed(2)}`,
    ], filters),
    headers: ['Date', 'Order Code', 'Customer', 'Status', 'Subtotal EUR', 'Shipping EUR', 'Discount EUR', 'Total EUR'],
    rows: revenueOrders.map((order) => ({
      Date: dateOnly(order.createdAt),
      'Order Code': order.orderCode,
      Customer: order.customerName,
      Status: order.status,
      'Subtotal EUR': money(order.subtotal),
      'Shipping EUR': money(order.shipping),
      'Discount EUR': money(order.discount),
      'Total EUR': money(order.total),
    })),
  }
}

async function buildOrdersReport(filters: ReportFilters): Promise<ReportDocument> {
  const orders = await getOrdersForReports(filters)

  return {
    title: 'Orders Report',
    subtitle: 'Operational order overview',
    summary: appendRangeSummary([
      `Total orders: ${orders.length}`,
      `Pending: ${orders.filter((order) => order.status === 'pending').length}`,
      `Confirmed: ${orders.filter((order) => order.status === 'confirmed').length}`,
      `Shipped: ${orders.filter((order) => order.status === 'shipped').length}`,
      `Delivered: ${orders.filter((order) => order.status === 'delivered').length}`,
      `Cancelled: ${orders.filter((order) => order.status === 'cancelled').length}`,
    ], filters),
    headers: [
      'Date',
      'Order Code',
      'Customer',
      'Email',
      'Country',
      'Status',
      'Items',
      'Quantity',
      'Total EUR',
      'Promo Code',
    ],
    rows: orders.map((order) => ({
      Date: dateOnly(order.createdAt),
      'Order Code': order.orderCode,
      Customer: order.customerName,
      Email: order.customerEmail,
      Country: order.country,
      Status: order.status,
      Items: order.items.map((item) => item.name).join(' | '),
      Quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      'Total EUR': money(order.total),
      'Promo Code': order.promoCode ?? '',
    })),
  }
}

async function buildClientAggregates(filters: ReportFilters) {
  const where = buildCreatedAtWhere(filters)
  const [orders, contacts, bespokeList] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        address: true,
        city: true,
        postcode: true,
        country: true,
        total: true,
        status: true,
        orderCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactMessage.findMany({
      where,
      select: { name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bespokeEnquiry.findMany({
      where,
      select: { name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const clients = new Map<string, ClientAggregate>()

  function upsert(
    email: string,
    name: string,
    date: Date,
    source: string,
    extra?: {
      phone?: string | null
      address?: string | null
      city?: string | null
      postcode?: string | null
      country?: string | null
      total?: number
      orderCode?: string
    },
  ) {
    const key = email.trim().toLowerCase()
    const existing = clients.get(key)

    if (existing) {
      if (date > existing.lastSeen) {
        existing.lastSeen = date
        existing.name = name
      }
      if (!existing.sources.includes(source)) existing.sources.push(source)
      if (extra?.phone && !existing.phone) existing.phone = extra.phone
      if (extra?.address && !existing.address) {
        existing.address = extra.address
        existing.city = extra.city ?? null
        existing.postcode = extra.postcode ?? null
        existing.country = extra.country ?? null
      }
      if (extra?.total) existing.totalSpent += extra.total
      if (extra?.orderCode) {
        existing.orderCount += 1
        existing.orderCodes.push(extra.orderCode)
      }
      return
    }

    clients.set(key, {
      name,
      email,
      phone: extra?.phone ?? null,
      address: extra?.address ?? null,
      city: extra?.city ?? null,
      postcode: extra?.postcode ?? null,
      country: extra?.country ?? null,
      totalSpent: extra?.total ?? 0,
      orderCount: extra?.orderCode ? 1 : 0,
      orderCodes: extra?.orderCode ? [extra.orderCode] : [],
      sources: [source],
      lastSeen: date,
    })
  }

  for (const order of orders) {
    upsert(order.customerEmail, order.customerName, order.createdAt, 'order', {
      phone: order.customerPhone,
      address: order.address,
      city: order.city,
      postcode: order.postcode,
      country: order.country,
      total: order.status === 'cancelled' ? 0 : toNumber(order.total),
      orderCode: order.orderCode,
    })
  }

  for (const contact of contacts) {
    upsert(contact.email, contact.name, contact.createdAt, 'contact')
  }

  for (const enquiry of bespokeList) {
    upsert(enquiry.email, enquiry.name, enquiry.createdAt, 'bespoke')
  }

  return Array.from(clients.values()).sort(
    (left, right) => right.totalSpent - left.totalSpent || right.lastSeen.getTime() - left.lastSeen.getTime(),
  )
}

async function buildClientReport(filters: ReportFilters): Promise<ReportDocument> {
  const clients = await buildClientAggregates(filters)

  return {
    title: 'Client Report',
    subtitle: 'Aggregated clients from orders, contact messages, and bespoke enquiries',
    summary: appendRangeSummary([
      `Total clients: ${clients.length}`,
      `Purchasing clients: ${clients.filter((client) => client.orderCount > 0).length}`,
      `Total client spend EUR: ${clients.reduce((sum, client) => sum + client.totalSpent, 0).toFixed(2)}`,
    ], filters),
    headers: [
      'Name',
      'Email',
      'Phone',
      'Country',
      'Sources',
      'Order Count',
      'Total Spent EUR',
      'Order Codes',
      'Last Seen',
    ],
    rows: clients.map((client) => ({
      Name: client.name,
      Email: client.email,
      Phone: client.phone ?? '',
      Country: client.country ?? '',
      Sources: client.sources.join(' | '),
      'Order Count': client.orderCount,
      'Total Spent EUR': client.totalSpent.toFixed(2),
      'Order Codes': client.orderCodes.join(' | '),
      'Last Seen': dateOnly(client.lastSeen),
    })),
  }
}

async function buildMaterialUsageReport(filters: ReportFilters): Promise<ReportDocument> {
  const orders = await getOrdersForReports(filters)
  const usage = new Map<string, {
    material: string
    origin: string
    quantity: number
    revenue: number
    orderCodes: Set<string>
    productNames: Set<string>
  }>()

  for (const order of orders) {
    if (order.status === 'cancelled') continue

    for (const item of order.items) {
      const material = item.product?.material?.name ?? 'Unassigned'
      const origin = item.product?.material?.origin ?? ''
      const key = `${material}::${origin}`
      const existing = usage.get(key) ?? {
        material,
        origin,
        quantity: 0,
        revenue: 0,
        orderCodes: new Set<string>(),
        productNames: new Set<string>(),
      }

      existing.quantity += item.quantity
      existing.revenue += toNumber(item.subtotal)
      existing.orderCodes.add(order.orderCode)
      existing.productNames.add(item.name)
      usage.set(key, existing)
    }
  }

  const rows = Array.from(usage.values())
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .map((item) => ({
      Material: item.material,
      Origin: item.origin,
      'Units Sold': item.quantity,
      'Revenue EUR': item.revenue.toFixed(2),
      'Order Count': item.orderCodes.size,
      Products: Array.from(item.productNames).join(' | '),
      'Order Codes': Array.from(item.orderCodes).join(' | '),
    }))

  return {
    title: 'Material Usage Report',
    subtitle: 'Material demand aggregated from order items and product material relationships',
    summary: appendRangeSummary([
      `Materials used: ${rows.length}`,
      `Units sold: ${rows.reduce((sum, row) => sum + Number(row['Units Sold']), 0)}`,
      `Material-linked revenue EUR: ${rows.reduce((sum, row) => sum + Number(row['Revenue EUR']), 0).toFixed(2)}`,
    ], filters),
    headers: ['Material', 'Origin', 'Units Sold', 'Revenue EUR', 'Order Count', 'Products', 'Order Codes'],
    rows,
  }
}

async function buildReportDocument(type: ReportType, filters: ReportFilters) {
  if (type === 'sales') return buildSalesReport(filters)
  if (type === 'orders') return buildOrdersReport(filters)
  if (type === 'clients') return buildClientReport(filters)
  return buildMaterialUsageReport(filters)
}

export function parseReportRequest(
  type: string | null | undefined,
  format: string | null | undefined,
  fromValue?: string | null,
  toValue?: string | null,
) {
  return {
    type: isReportType(type) ? type : null,
    format: isReportFormat(format) ? format : 'csv',
    filters: buildReportFilters(fromValue, toValue),
  }
}

export async function generateBusinessReport(
  type: ReportType,
  format: ReportFormat,
  filters: ReportFilters,
) {
  const document = await buildReportDocument(type, filters)
  const filename = makeFileName(type, format, filters)

  if (format === 'pdf') {
    return {
      body: buildPdf(document),
      contentType: 'application/pdf',
      filename,
    }
  }

  return {
    body: buildCsv(document),
    contentType: 'text/csv; charset=utf-8',
    filename,
  }
}
