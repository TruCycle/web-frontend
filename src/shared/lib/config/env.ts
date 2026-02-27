const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const websocketUrl = import.meta.env.VITE_WS_URL?.trim() || ''
const defaultSearchPostcode =
  import.meta.env.VITE_DEFAULT_SEARCH_POSTCODE?.trim() || 'IG11 7FR'

export const env = {
  apiBaseUrl,
  websocketUrl,
  defaultSearchPostcode,
} as const
