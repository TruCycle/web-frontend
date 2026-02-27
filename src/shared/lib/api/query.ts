export type QueryValue = string | number | boolean | null | undefined

const maxLimitValue = 50

export function toQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    params.set(key, String(value))
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function clampLimit(limit: number | undefined, fallback: number = maxLimitValue): number {
  const numericLimit = Number.isFinite(limit) ? Number(limit) : fallback
  if (numericLimit < 1) {
    return 1
  }

  if (numericLimit > maxLimitValue) {
    return maxLimitValue
  }

  return Math.floor(numericLimit)
}
