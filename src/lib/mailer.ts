import nodemailer from 'nodemailer'
import { formatPrice, normalizeCurrencyCode, type CurrencyFormatOptions } from './helpers'

const FROM = `"Prela Atelier" <hello@prela-atelier.com>`
const ADMIN = process.env.ADMIN_EMAIL ?? 'hello@prela-atelier.com'

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) return // skip silently if not configured
  try {
    await transporter().sendMail({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('[mailer]', err)
  }
}

// ── Shared layout ─────────────────────────────────────────────────────────────
function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prela Atelier</title>
<style>
  body{margin:0;padding:0;background:#f5f3f0;font-family:'Georgia',serif;}
  .wrap{max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e8e4de;}
  .header{background:#2a2422;padding:32px 40px;text-align:center;}
  .header-title{color:#b08d57;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px;}
  .header-brand{color:#f5f3f0;font-size:28px;font-weight:400;margin:0;}
  .body{padding:40px;}
  .eyebrow{color:#b08d57;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;font-family:sans-serif;margin:0 0 8px;}
  .title{color:#2a2422;font-size:24px;font-weight:400;margin:0 0 20px;line-height:1.3;}
  p{color:#5a5350;font-family:sans-serif;font-size:14px;line-height:1.7;margin:0 0 16px;}
  .divider{border:none;border-top:1px solid #e8e4de;margin:28px 0;}
  .table{width:100%;border-collapse:collapse;font-family:sans-serif;font-size:13px;}
  .table td{padding:8px 0;color:#5a5350;vertical-align:top;}
  .table td.right{text-align:right;}
  .table tr.total td{border-top:1px solid #e8e4de;padding-top:12px;font-size:14px;color:#2a2422;}
  .btn{display:inline-block;background:#b08d57;color:#fff;text-decoration:none;padding:12px 28px;font-family:sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:8px 0;}
  .footer{background:#f5f3f0;padding:24px 40px;text-align:center;border-top:1px solid #e8e4de;}
  .footer p{color:#9a9390;font-size:12px;font-family:sans-serif;margin:0;}
  .badge{display:inline-block;background:#f5f3f0;border:1px solid #e8e4de;padding:4px 12px;font-family:sans-serif;font-size:11px;color:#5a5350;letter-spacing:0.1em;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-title">Handcrafted Marble Accessories</p>
    <p class="header-brand">Prela Atelier</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>Prela Atelier &nbsp;·&nbsp; Laç, Albania<br>
    <a href="mailto:hello@prela-atelier.com" style="color:#b08d57;">hello@prela-atelier.com</a></p>
  </div>
</div>
</body>
</html>`
}

// ── Order confirmation (to customer) ─────────────────────────────────────────
type OrderItem = { name: string; quantity: number; subtotal: number }

type MoneyDisplayOptions = {
  currencyOptions?: CurrencyFormatOptions
}

function money(value: number, currencyOptions?: CurrencyFormatOptions) {
  return formatPrice(value, currencyOptions)
}

function appUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prela-atelier.com'
  return rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `https://${rawUrl}`
}

function invoiceUrl(orderCode: string, currencyOptions?: CurrencyFormatOptions) {
  const url = new URL(`/api/invoice/${orderCode}`, appUrl())
  if (currencyOptions?.currency) {
    url.searchParams.set('currency', normalizeCurrencyCode(String(currencyOptions.currency)))
  }
  return url.toString()
}

export async function sendOrderConfirmation(opts: {
  to: string
  customerName: string
  orderCode: string
  items: OrderItem[]
  shipping: number
  total: number
} & MoneyDisplayOptions) {
  const firstName = opts.customerName.split(' ')[0]
  const rows = opts.items
    .map(
      (i) => `<tr><td>${i.name} × ${i.quantity}</td><td class="right">${money(i.subtotal, opts.currencyOptions)}</td></tr>`
    )
    .join('')

  const body = `
    <p class="eyebrow">Order Confirmed</p>
    <h1 class="title">Your payment has been confirmed, ${firstName}.</h1>
    <p>Thank you — your order is now confirmed and is being prepared with care. You will receive a shipping notification once your piece is on its way.</p>
    <hr class="divider">
    <p class="eyebrow">Order Reference</p>
    <p><span class="badge">${opts.orderCode}</span></p>
    <hr class="divider">
    <p class="eyebrow">Order Summary</p>
    <table class="table">
      <tbody>
        ${rows}
        <tr><td style="padding-top:12px;border-top:1px solid #e8e4de;">Shipping</td><td class="right" style="padding-top:12px;border-top:1px solid #e8e4de;">${opts.shipping === 0 ? 'Free' : money(opts.shipping, opts.currencyOptions)}</td></tr>
        <tr class="total"><td><strong>Total</strong></td><td class="right"><strong>${money(opts.total, opts.currencyOptions)}</strong></td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <a href="${appUrl()}/track-order?order=${opts.orderCode}" class="btn">Track Your Order</a>
    &nbsp;&nbsp;
    <a href="${invoiceUrl(opts.orderCode, opts.currencyOptions)}" class="btn" style="background:#5a5350;">View Invoice</a>
    <p style="margin-top:24px;">If you have any questions, reply to this email or reach us at <a href="mailto:hello@prela-atelier.com" style="color:#b08d57;">hello@prela-atelier.com</a>.</p>
  `

  await send(opts.to, `Order confirmed — ${opts.orderCode}`, layout(body))
}

// ── Bank transfer payment instructions (to customer on order placement) ──────
export async function sendBankTransferInstructions(opts: {
  to: string
  customerName: string
  orderCode: string
  items: OrderItem[]
  shipping: number
  total: number
  bankAccountName: string
  bankIban: string
  bankName: string
} & MoneyDisplayOptions) {
  const firstName = opts.customerName.split(' ')[0]
  const rows = opts.items
    .map(
      (i) => `<tr><td>${i.name} × ${i.quantity}</td><td class="right">${money(i.subtotal, opts.currencyOptions)}</td></tr>`
    )
    .join('')

  const body = `
    <p class="eyebrow">Order Received</p>
    <h1 class="title">Thank you, ${firstName}.</h1>
    <p>Your order has been received. To complete your purchase, please transfer the exact amount below to our bank account using your order code as the payment reference.</p>
    <hr class="divider">
    <p class="eyebrow">Order Reference</p>
    <p><span class="badge">${opts.orderCode}</span></p>
    <hr class="divider">
    <p class="eyebrow">Order Summary</p>
    <table class="table">
      <tbody>
        ${rows}
        <tr><td style="padding-top:12px;border-top:1px solid #e8e4de;">Shipping</td><td class="right" style="padding-top:12px;border-top:1px solid #e8e4de;">${opts.shipping === 0 ? 'Free' : money(opts.shipping, opts.currencyOptions)}</td></tr>
        <tr class="total"><td><strong>Amount to Transfer</strong></td><td class="right"><strong>${money(opts.total, opts.currencyOptions)}</strong></td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <p class="eyebrow">Bank Transfer Details</p>
    <table class="table">
      <tbody>
        <tr><td>Account Name</td><td class="right"><strong>${opts.bankAccountName}</strong></td></tr>
        <tr><td>IBAN</td><td class="right"><strong style="font-family:monospace;letter-spacing:0.05em;">${opts.bankIban}</strong></td></tr>
        <tr><td>Bank</td><td class="right">${opts.bankName}</td></tr>
        <tr><td>Reference / Description</td><td class="right"><strong>${opts.orderCode}</strong></td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <a href="${invoiceUrl(opts.orderCode, opts.currencyOptions)}" class="btn">View Invoice</a>
    <hr class="divider">
    <p>Once we receive your transfer, we will confirm your order and begin preparing your piece. If you have any questions, reply to this email or reach us at <a href="mailto:hello@prela-atelier.com" style="color:#b08d57;">hello@prela-atelier.com</a>.</p>
  `

  await send(opts.to, `Order received — ${opts.orderCode}`, layout(body))
}

// ── New order alert (to admin) ────────────────────────────────────────────────
export async function sendNewOrderAlert(opts: {
  customerName: string
  customerEmail: string
  orderCode: string
  items: OrderItem[]
  shipping: number
  total: number
} & MoneyDisplayOptions) {
  const rows = opts.items
    .map(
      (i) => `<tr><td>${i.name} × ${i.quantity}</td><td class="right">${money(i.subtotal, opts.currencyOptions)}</td></tr>`
    )
    .join('')

  const body = `
    <p class="eyebrow">New Order</p>
    <h1 class="title">Order ${opts.orderCode}</h1>
    <p><strong>Customer:</strong> ${opts.customerName} &lt;${opts.customerEmail}&gt;</p>
    <hr class="divider">
    <table class="table">
      <tbody>
        ${rows}
        <tr><td style="padding-top:12px;border-top:1px solid #e8e4de;">Shipping</td><td class="right" style="padding-top:12px;border-top:1px solid #e8e4de;">${opts.shipping === 0 ? 'Free' : money(opts.shipping, opts.currencyOptions)}</td></tr>
        <tr class="total"><td><strong>Total</strong></td><td class="right"><strong>${money(opts.total, opts.currencyOptions)}</strong></td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <a href="${appUrl()}/admin/orders" class="btn">View in Admin</a>
  `

  await send(ADMIN, `New order — ${opts.orderCode} (${money(opts.total, opts.currencyOptions)})`, layout(body))
}

// ── Contact form confirmation (to sender) ────────────────────────────────────
export async function sendContactConfirmation(opts: {
  to: string
  name: string
  subject?: string
  message: string
}) {
  const firstName = opts.name.split(' ')[0]
  const body = `
    <p class="eyebrow">Message Received</p>
    <h1 class="title">Thank you, ${firstName}.</h1>
    <p>We have received your message and will get back to you within 2 business days.</p>
    <hr class="divider">
    <p class="eyebrow">Your Message</p>
    ${opts.subject ? `<p><strong>Subject:</strong> ${opts.subject}</p>` : ''}
    <p style="white-space:pre-wrap;">${opts.message}</p>
  `
  await send(opts.to, 'We received your message — Prela Atelier', layout(body))
}

// ── Contact notification (to admin) ──────────────────────────────────────────
export async function sendContactNotification(opts: {
  name: string
  email: string
  subject?: string
  message: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prela-atelier.com'
  const body = `
    <p class="eyebrow">New Contact Message</p>
    <h1 class="title">Message from ${opts.name}</h1>
    <p><strong>Email:</strong> <a href="mailto:${opts.email}" style="color:#b08d57;">${opts.email}</a></p>
    ${opts.subject ? `<p><strong>Subject:</strong> ${opts.subject}</p>` : ''}
    <hr class="divider">
    <p style="white-space:pre-wrap;">${opts.message}</p>
    <hr class="divider">
    <a href="${appUrl}/admin" class="btn">Go to Admin</a>
  `
  await send(ADMIN, `New message from ${opts.name}`, layout(body))
}

// ── Bespoke confirmation (to sender) ─────────────────────────────────────────
export async function sendBespokeConfirmation(opts: {
  to: string
  name: string
  type?: string
  budget?: string
  description: string
  quoteSummary?: string
}) {
  const firstName = opts.name.split(' ')[0]
  const body = `
    <p class="eyebrow">Enquiry Received</p>
    <h1 class="title">Thank you, ${firstName}.</h1>
    <p>We have received your bespoke commission enquiry. Our team will review your brief and contact you within 2 business days to discuss the details.</p>
    <hr class="divider">
    <p class="eyebrow">Your Brief</p>
    ${opts.type ? `<p><strong>Type of piece:</strong> ${opts.type}</p>` : ''}
    ${opts.budget ? `<p><strong>Budget:</strong> ${opts.budget}</p>` : ''}
    <p style="white-space:pre-wrap;">${opts.description}</p>
    <hr class="divider">
    <p>While you wait, feel free to browse our ready-made collection:</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://prela-atelier.com'}/collections" class="btn">Browse the Collection</a>
  `
  await send(opts.to, 'Bespoke enquiry received — Prela Atelier', layout(body))
}

// ── Admin settings save confirmation code ────────────────────────────────────
export async function sendAdminConfirmCode(opts: {
  to: string
  code: string
}) {
  const body = `
    <p class="eyebrow">Confirm Changes</p>
    <h1 class="title">Confirm your settings update.</h1>
    <p>Enter the code below in the admin panel to apply your changes. It expires in 15 minutes.</p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:#f5f3f0;border:1px solid #e8e4de;padding:16px 40px;font-family:monospace;font-size:32px;letter-spacing:0.3em;color:#2a2422;">${opts.code}</span>
    </div>
    <hr class="divider">
    <p>If you did not initiate this, someone may have access to your admin panel.</p>
  `
  await send(opts.to, `${opts.code} — Confirm settings update`, layout(body))
}

// ── Customer mobile sign-in code ─────────────────────────────────────────────
export async function sendCustomerLoginCode(opts: {
  to: string
  code: string
}) {
  const body = `
    <p class="eyebrow">Sign In Code</p>
    <h1 class="title">Confirm your email address.</h1>
    <p>Enter the code below in the Prela Atelier app to sign in and view your order history. It expires in 10 minutes.</p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background:#f5f3f0;border:1px solid #e8e4de;padding:16px 40px;font-family:monospace;font-size:32px;letter-spacing:0.3em;color:#2a2422;">${opts.code}</span>
    </div>
    <hr class="divider">
    <p>If you did not request this code, you can ignore this email.</p>
  `
  await send(opts.to, `${opts.code} - Your Prela Atelier sign-in code`, layout(body))
}

// ── Admin email change notification (to old email) ───────────────────────────
export async function sendAdminEmailChangeNotification(opts: {
  oldEmail: string
  newEmail: string
}) {
  const body = `
    <p class="eyebrow">Security Notice</p>
    <h1 class="title">Your admin email was changed.</h1>
    <p>The email address associated with your Prela Atelier admin account has been updated.</p>
    <table class="table">
      <tbody>
        <tr><td>Previous email</td><td class="right">${opts.oldEmail}</td></tr>
        <tr><td>New email</td><td class="right">${opts.newEmail || '(removed)'}</td></tr>
      </tbody>
    </table>
    <hr class="divider">
    <p>If you did not make this change, please update your credentials immediately and contact your hosting provider.</p>
  `
  await send(opts.oldEmail, 'Admin email address changed — Prela Atelier', layout(body))
}

// ── Bespoke notification (to admin) ──────────────────────────────────────────
export async function sendBespokeNotification(opts: {
  name: string
  email: string
  type?: string
  budget?: string
  description: string
  timeline?: string
  quoteSummary?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prela-atelier.com'
  const body = `
    <p class="eyebrow">New Bespoke Enquiry</p>
    <h1 class="title">Enquiry from ${opts.name}</h1>
    <p><strong>Email:</strong> <a href="mailto:${opts.email}" style="color:#b08d57;">${opts.email}</a></p>
    ${opts.type ? `<p><strong>Type:</strong> ${opts.type}</p>` : ''}
    ${opts.budget ? `<p><strong>Budget:</strong> ${opts.budget}</p>` : ''}
    ${opts.timeline ? `<p><strong>Timeline:</strong> ${opts.timeline}</p>` : ''}
    <hr class="divider">
    <p style="white-space:pre-wrap;">${opts.description}</p>
    <hr class="divider">
    <a href="${appUrl}/admin" class="btn">Go to Admin</a>
  `
  await send(ADMIN, `New bespoke enquiry from ${opts.name}`, layout(body))
}
