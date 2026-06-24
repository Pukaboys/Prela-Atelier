import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { InventoryError } from '@/server/services/inventory-service'
import {
  updateProductionPriority,
  updateOrderStatus,
  updateProductionStage,
} from '@/server/services/order-service'
import { orderWorkflowUpdateSchema } from '@/server/validations/order'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id)
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = orderWorkflowUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, formError: parsed.error.errors[0]?.message },
      { status: 422 },
    )
  }

  try {
    let order = null

    if (parsed.data.status) {
      order = await updateOrderStatus(numId, parsed.data.status)
    }

    if (parsed.data.productionStage) {
      order = await updateProductionStage(numId, parsed.data.productionStage)
    }

    if (parsed.data.productionPriority) {
      order = await updateProductionPriority(numId, parsed.data.productionPriority)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      status: order.status,
      productionStage: order.productionStage,
      productionPriority: order.productionPriority,
      production: order.production,
      notes: order.notes,
    })
  } catch (error) {
    if (error instanceof InventoryError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }
}
