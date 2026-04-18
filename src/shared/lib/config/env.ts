const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'
const websocketUrl = import.meta.env.VITE_WS_URL?.trim() || ''
const defaultSearchPostcode =
  import.meta.env.VITE_DEFAULT_SEARCH_POSTCODE?.trim() || 'IG11 7FR'
const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || ''
const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || ''
const cloudinaryFolder = import.meta.env.VITE_CLOUDINARY_FOLDER?.trim() || ''
const googleAnalyticsMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || ''
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID?.trim() || ''

export const env = {
  apiBaseUrl,
  websocketUrl,
  defaultSearchPostcode,
  cloudinaryCloudName,
  cloudinaryUploadPreset,
  cloudinaryFolder,
  googleAnalyticsMeasurementId,
  metaPixelId,
} as const
