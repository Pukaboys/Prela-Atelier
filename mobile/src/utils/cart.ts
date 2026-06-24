export function buildCartItemId(productId: number, materialId?: number | null) {
  return `${productId}:${typeof materialId === 'number' && materialId > 0 ? materialId : 'base'}`;
}
