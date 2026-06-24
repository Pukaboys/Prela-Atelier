import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { formatPrice, getCurrencyFormatOptions } from '@/lib/helpers'
import { getSettings } from '@/lib/settings'
import { getCustomerOrderNotes } from '@/server/services/order-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  await requireAdmin()
  const { orderCode } = await params

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { orderCode },
      include: { items: true },
    }),
    getSettings(),
  ])

  if (!order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  const currencyOptions = getCurrencyFormatOptions(settings)
  const money = (value: number) => formatPrice(value, currencyOptions)
  const isDownload = request.nextUrl.searchParams.get('download') === '1'
  const downloadUrl = new URL(request.nextUrl)
  downloadUrl.searchParams.set('download', '1')
  const downloadHref = `${downloadUrl.pathname}${downloadUrl.search}`

  const issueDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const rows = order.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${money(Number(item.priceEur))}</td>
      <td class="right">${money(Number(item.subtotal))}</td>
    </tr>
  `).join('')

  const subtotal = Number(order.subtotal)
  const shipping = Number(order.shipping)
  const discount = Number(order.discount)
  const total = Number(order.total)
  const customerNotes = getCustomerOrderNotes(order)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${order.orderCode} — Prela Atelier</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #fff; color: #2a2422; font-size: 13px; }
    .page { max-width: 780px; margin: 0 auto; padding: 48px 48px 64px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2a2422; padding-bottom: 28px; margin-bottom: 36px; }
    .brand-name { font-size: 26px; letter-spacing: 0.2em; text-transform: uppercase; }
    .brand-sub { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #b08d57; margin-top: 4px; font-family: sans-serif; }
    .invoice-meta { text-align: right; font-family: sans-serif; }
    .invoice-title { font-size: 22px; font-weight: 400; color: #b08d57; letter-spacing: 0.1em; text-transform: uppercase; }
    .invoice-code { font-size: 13px; color: #5a5350; margin-top: 6px; font-family: monospace; letter-spacing: 0.1em; }
    .invoice-date { font-size: 11px; color: #9a9390; margin-top: 4px; }

    /* Addresses */
    .addresses { display: flex; justify-content: space-between; margin-bottom: 36px; gap: 24px; }
    .address-block { flex: 1; }
    .address-label { font-size: 9px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.25em; color: #b08d57; margin-bottom: 8px; }
    .address-block p { font-size: 13px; color: #2a2422; line-height: 1.7; }

    /* Status badge */
    .status-bar { background: #f5f3f0; border: 1px solid #e8e4de; padding: 10px 16px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; font-family: sans-serif; font-size: 11px; }
    .status-label { text-transform: uppercase; letter-spacing: 0.2em; color: #9a9390; }
    .status-value { font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #b08d57; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead tr { border-bottom: 1px solid #2a2422; }
    th { font-family: sans-serif; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: #9a9390; padding: 0 0 10px; font-weight: 400; text-align: left; }
    th.center { text-align: center; }
    th.right { text-align: right; }
    td { padding: 11px 0; border-bottom: 1px solid #e8e4de; font-size: 13px; color: #2a2422; vertical-align: top; }
    td.center { text-align: center; }
    td.right { text-align: right; }

    /* Totals */
    .totals { margin-top: 0; border-top: none; display: flex; justify-content: flex-end; }
    .totals-inner { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-family: sans-serif; font-size: 12px; color: #5a5350; border-bottom: 1px solid #f0eeea; }
    .totals-row.grand { border-top: 2px solid #2a2422; border-bottom: none; margin-top: 4px; padding-top: 12px; font-size: 15px; color: #2a2422; font-weight: 600; font-family: 'Georgia', serif; }
    .totals-row span:last-child { font-family: 'Georgia', serif; }

    /* Footer */
    .footer { margin-top: 56px; border-top: 1px solid #e8e4de; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-note { font-family: sans-serif; font-size: 10px; color: #9a9390; line-height: 1.7; }
    .footer-brand { font-size: 16px; letter-spacing: 0.2em; color: #b08d57; text-transform: uppercase; }

    /* Print */
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page { padding: 24px; }
    }

    /* Print button */
    .print-bar { background: #2a2422; color: #f5f3f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-family: sans-serif; font-size: 12px; }
    .print-actions { display: flex; align-items: center; gap: 10px; }
    .print-btn { background: #b08d57; color: #fff; border: none; padding: 8px 20px; font-family: sans-serif; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; text-decoration: none; }
    .download-btn { background: transparent; border: 1px solid #b08d57; color: #f5f3f0; }
    .print-btn:hover { background: #9a7a48; }
    .download-btn:hover { background: #b08d57; }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <span>Invoice ${order.orderCode}</span>
    <div class="print-actions">
      <a class="print-btn download-btn" href="${downloadHref}">Download Invoice</a>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>

  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-name">Prela Atelier</div>
        <div class="brand-sub">Handcrafted Marble Accessories</div>
        <div style="margin-top:12px;font-family:sans-serif;font-size:11px;color:#9a9390;line-height:1.7;">
          Laç, Albania<br>
          hello@prela-atelier.com<br>
          www.prela-atelier.com
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-code">${order.orderCode}</div>
        <div class="invoice-date">Issued: ${issueDate}</div>
      </div>
    </div>

    <!-- Addresses -->
    <div class="addresses">
      <div class="address-block">
        <div class="address-label">Bill To</div>
        <p><strong>${order.customerName}</strong></p>
        <p>${order.address}</p>
        <p>${order.city}${order.postcode ? `, ${order.postcode}` : ''}</p>
        <p>${order.country}</p>
        ${order.customerEmail ? `<p style="margin-top:6px;font-family:sans-serif;font-size:12px;color:#5a5350;">${order.customerEmail}</p>` : ''}
        ${order.customerPhone ? `<p style="font-family:sans-serif;font-size:12px;color:#5a5350;">${order.customerPhone}</p>` : ''}
      </div>
      <div class="address-block" style="text-align:right;">
        <div class="address-label">Payment Status</div>
        <p style="font-family:sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${order.status === 'pending' ? '#b08d57' : order.status === 'cancelled' ? '#dc2626' : '#16a34a'};">
          ${order.status === 'pending' ? 'Awaiting Payment' : order.status === 'cancelled' ? 'Cancelled' : 'Paid'}
        </p>
        ${order.promoCode ? `<p style="font-family:sans-serif;font-size:11px;color:#9a9390;margin-top:4px;">Promo code: ${order.promoCode}</p>` : ''}
      </div>
    </div>

    <!-- Items table -->
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="center">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-inner">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${money(subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Shipping</span>
          <span>${shipping === 0 ? 'Free' : money(shipping)}</span>
        </div>
        ${discount > 0 ? `
        <div class="totals-row">
          <span>Discount${order.promoCode ? ` (${order.promoCode})` : ''}</span>
          <span>−${money(discount)}</span>
        </div>` : ''}
        <div class="totals-row grand">
          <span>Total</span>
          <span>${money(total)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-note">
        Thank you for your order.<br>
        For questions, contact us at hello@prela-atelier.com
        ${customerNotes ? `<br><em>Note: ${customerNotes}</em>` : ''}
      </div>
      <div class="footer-brand">Prela ✦</div>
    </div>

  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...(isDownload
        ? { 'Content-Disposition': `attachment; filename="invoice-${order.orderCode}.html"` }
        : {}),
    },
  })
}
