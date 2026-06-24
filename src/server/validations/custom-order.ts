import { z } from 'zod'

export const customOrderCalculationSchema = z.object({
  widthCm: z.number().min(5).max(1000),
  heightCm: z.number().min(5).max(1000),
  thicknessCm: z.number().min(0.5).max(20).optional().nullable(),
  quantity: z.number().int().min(1).max(100),
  materialId: z.number().int().positive(),
})

export type CustomOrderCalculationInput = z.infer<typeof customOrderCalculationSchema>
