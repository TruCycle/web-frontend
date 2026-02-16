const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const websocketUrl = import.meta.env.VITE_WS_URL?.trim() || ''

export const env = {
  apiBaseUrl,
  websocketUrl,
} as const
