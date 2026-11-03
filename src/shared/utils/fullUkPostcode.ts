// Structural formatting only; this does not establish allocation or a venue.
export function normalizeFullUkPostcode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const compact = value.trim().toUpperCase().replace(/\s+/g, '')
  const formatted = compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact
  return /^(?:[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}|GIR 0AA)$/.test(formatted) ? formatted : null
}
