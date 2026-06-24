import { z } from 'zod'
import { PRODUCTION_PRIORITIES, PRODUCTION_STAGES } from '@/lib/production-workflow'

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
export const CHECKOUT_CURRENCIES = ['EUR', 'USD', 'GBP'] as const

export const checkoutCartItemSchema = z.object({
  cartItemId: z.string().max(120).optional(),
  productId: z.number().int().positive(),
  materialId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().min(1).max(99),
})

export const checkoutSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().default(''),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postcode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default('France'),
  notes: z.string().max(1000).optional().default(''),
  items: z.array(checkoutCartItemSchema).optional(),
  currency: z.enum(CHECKOUT_CURRENCIES).optional().default('EUR'),
  promoCode: z.string().max(50).optional(),
})

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
})

export const orderWorkflowUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  productionStage: z.enum(PRODUCTION_STAGES).optional(),
  productionPriority: z.enum(PRODUCTION_PRIORITIES).optional(),
}).refine((value) => value.status || value.productionStage || value.productionPriority, {
  message: 'Please provide a status, production stage, or production priority update.',
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type OrderStatusInput = z.infer<typeof orderStatusUpdateSchema>['status']
export type OrderWorkflowUpdateInput = z.infer<typeof orderWorkflowUpdateSchema>
