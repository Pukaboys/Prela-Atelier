import prisma from '@/lib/db'
import { sendBespokeConfirmation, sendBespokeNotification } from '@/lib/mailer'
import type { BespokeEnquiryInput } from '@/server/validations/bespoke'

export async function createBespokeEnquiry(
  input: BespokeEnquiryInput & { notes?: string; quoteSummary?: string }
) {
  const { name, email, type, budget, description, timeline, notes, quoteSummary } = input

  const enquiry = await prisma.bespokeEnquiry.create({
    data: {
      name,
      email,
      type: type || null,
      budget: budget || null,
      description,
      timeline: timeline || null,
      notes: notes || null,
    },
  })

  await Promise.allSettled([
    sendBespokeConfirmation({ to: email, name, type, budget, description, quoteSummary }),
    sendBespokeNotification({ name, email, type, budget, description, timeline, quoteSummary }),
  ])

  return enquiry
}
