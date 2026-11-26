import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { toQueryString } from '@/shared/lib/api/query'
import type { Shop } from '@/features/partner-shops/types'
import { normalizeFullUkPostcode } from '@/shared/utils/fullUkPostcode'

interface FetchNearbyShopsParams {
  readonly postcode?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mapOpeningHours(rawOpeningHours: Record<string, unknown> | null): string {
  if (!rawOpeningHours) {
    return 'Opening hours unavailable'
  }

  const days = Array.isArray(rawOpeningHours.days)
    ? [...new Set(rawOpeningHours.days.filter((day): day is string => typeof day === 'string' && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day)))]
    : []
  const openTime = readString(rawOpeningHours.open_time)
  const closeTime = readString(rawOpeningHours.close_time)

  const validTime = (value: string | null) => value !== null && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  if (days.length === 0 || !validTime(openTime) || !validTime(closeTime)) {
    return 'Opening hours unavailable'
  }

  return `${days.join(', ')}: ${openTime} - ${closeTime}`
}

function mapShop(value: unknown): Shop | null {
  const shop = asRecord(value)
  if (!shop) {
    return null
  }

  const id = readString(shop.id)
  const name = readString(shop.name) ?? 'Partner shop'
  if (!id) {
    return null
  }

  const categories = Array.isArray(shop.acceptable_categories)
    ? [...new Set(shop.acceptable_categories.map(readString).filter((category): category is string => category !== null))]
    : []
  const distanceMeters = readNumber(shop.distanceMeters)
  const latitude = readNumber(shop.latitude), longitude = readNumber(shop.longitude)
  const validPoint = latitude !== null && longitude !== null && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  const postcode = normalizeFullUkPostcode(shop.postcode)
  const address = readString(shop.address_line)
  const destination = address && postcode ? `${address}, ${postcode}` : validPoint ? `${latitude},${longitude}` : null
  const directionsUrl = destination ? `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination })}` : null

  return {
    id,
    name,
    postcode: postcode ?? 'Postcode unavailable',
    address: address ?? 'Address unavailable',
    distance: distanceMeters !== null && distanceMeters >= 0 ? `${(distanceMeters / 1000).toFixed(1)} km` : 'Distance unavailable',
    openingHours: mapOpeningHours(asRecord(shop.opening_hours)),
    acceptedItems: categories,
    amenities: [],
    latitude: validPoint ? latitude : null,
    longitude: validPoint ? longitude : null,
    directionsUrl,
  }
}

export async function fetchNearbyShops(
  params: FetchNearbyShopsParams = {},
): Promise<Shop[]> {
  const query = toQueryString({
    postcode: params.postcode,
    radius_m: 5000,
  })

  const response = await apiRequest<unknown>(`/shops/nearby${query}`)
  const data = unwrapApiData<unknown>(response)
  if (!Array.isArray(data)) {
    return []
  }

  const shops = data
    .map((entry) => mapShop(entry))
    .filter((entry): entry is Shop => entry !== null)
  return [...new Map(shops.map(shop => [shop.id, shop])).values()]
}
