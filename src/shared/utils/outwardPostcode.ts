// Automatic public labels/shares never inherit a full postcode from an owner DTO.
export function outwardPostcode(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toUpperCase().replace(/\s+/g, ' ')
  const full = normalized.match(/^([A-Z]{1,2}\d[A-Z\d]?|GIR) ?\d[A-Z]{2}$/)
  if (full) return full[1]
  return /^(?:[A-Z]{1,2}\d[A-Z\d]?|GIR)$/.test(normalized) ? normalized : ''
}
