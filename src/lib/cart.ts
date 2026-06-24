import type { CartItem } from '@/types'

export function buildCartItemId(productId: number, materialId?: number | null) {
  return `${productId}:${typeof materialId === 'number' && materialId > 0 ? materialId : 'base'}`
}

export function normalizeCartItem(item: Omit<CartItem, 'cartItemId' | 'materialId' | 'materialName'> & Partial<Pick<CartItem, 'cartItemId' | 'materialId' | 'materialName'>>) {
  const materialId = typeof item.materialId === 'number' && item.materialId > 0 ? item.materialId : null

  return {
    ...item,
    cartItemId: item.cartItemId?.trim() || buildCartItemId(item.productId, materialId),
    materialId,
    materialName: item.materialName?.trim() || null,
  }
}

export function normalizeCartItems(items: CartItem[] | undefined | null) {
  return (items ?? []).map((item) => normalizeCartItem(item))
}

export function buildOrderItemName(item: Pick<CartItem, 'name' | 'materialName'>) {
  return item.materialName ? `${item.name} - ${item.materialName}` : item.name
}
