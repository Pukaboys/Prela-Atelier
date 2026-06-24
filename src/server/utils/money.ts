export type DecimalLike = number | string | { toNumber(): number }

export function toNumber(value: DecimalLike) {
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber()
  }

  return Number(value)
}
