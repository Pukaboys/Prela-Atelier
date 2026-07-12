import prisma from './db'

export const SETTING_DEFAULTS: Record<string, string> = {
  shipping_free_threshold: '500',
  shipping_eu_rate: '95',
  shipping_intl_rate: '45',
  contact_email: 'hello@prela-atelier.com',
  contact_whatsapp: '355696786451',
  contact_whatsapp_display: '+355 69 678 6451',
  contact_studio: 'Laç, Albania',
  contact_hours_days: 'Monday–Friday',
  contact_hours_time: '09:00–17:00 CET',
  store_description: 'Handcrafted marble accessories of timeless beauty, sourced from the finest quarries of the world.',
  response_days: '2',
  display_currency: 'EUR',
  currency_usd_rate: '1.09',
  currency_gbp_rate: '0.86',
  custom_order_production_multiplier: '0.65',
  pokpay_enabled: 'true',
  bank_transfer_enabled: 'true',
  bank_account_name: '',
  bank_iban: '',
  bank_name: '',
  inventory_low_stock_threshold: '3',
  inventory_log: '[]',
  banner_enabled: 'false',
  banner_text: '',
  banner_bg: '#1a1713',
  banner_text_color: '#faf8f4',
  banner_pinned: 'false',
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const result = { ...SETTING_DEFAULTS }
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? SETTING_DEFAULTS[key] ?? ''
}
