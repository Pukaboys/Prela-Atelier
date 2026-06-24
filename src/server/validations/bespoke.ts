import { z } from 'zod'

export const bespokeEnquirySchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().max(150),
  type: z.string().max(100).optional().default(''),
  budget: z.string().max(100).optional().default(''),
  description: z.string().min(1).max(5000),
  timeline: z.string().max(200).optional().default(''),
})

export type BespokeEnquiryInput = z.infer<typeof bespokeEnquirySchema>
