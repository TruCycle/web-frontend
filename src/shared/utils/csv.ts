/**
 * Convert a 2D array (header row first) into a CSV string with proper RFC 4180
 * quoting. Values are coerced via String() and any value containing comma,
 * double-quote, CR or LF is wrapped in double quotes (with internal quotes
 * doubled).
 */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>): string {
  const escape = (raw: string | number | null | undefined): string => {
    if (raw === null || raw === undefined) return ''
    const value = String(raw)
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  return rows.map((row) => row.map(escape).join(',')).join('\r\n')
}

/** Trigger a browser download for the supplied CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
