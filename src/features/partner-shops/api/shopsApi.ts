import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { toQueryString } from '@/shared/lib/api/query'
import type { Shop } from '@/features/partner-shops/types'

interface FetchNearbyShopsParams {
  readonly postcode?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mapOpeningHours(rawOpeningHours: Record<string, unknown> | null): string {
  if (!rawOpeningHours) {
    return 'Opening hours unavailable'
  }

  const days = Array.isArray(rawOpeningHours.days)
    ? rawOpeningHours.days.filter((day): day is string => typeof day === 'string')
    : []
  const openTime = readString(rawOpeningHours.open_time)
  const closeTime = readString(rawOpeningHours.close_time)

  if (days.length === 0 || !openTime || !closeTime) {
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
  const name = readString(shop.name)
  if (!id || !name) {
    return null
  }

  const categories = Array.isArray(shop.acceptable_categories)
    ? shop.acceptable_categories.filter(
        (category): category is string => typeof category === 'string',
      )
    : []
  const distanceMeters = readNumber(shop.distanceMeters)

  return {
    id,
    name,
    postcode: readString(shop.postcode) ?? 'N/A',
    address: readString(shop.address_line) ?? 'Address unavailable',
    distance: distanceMeters !== null ? `${(distanceMeters / 1000).toFixed(1)} km` : 'N/A',
    openingHours: mapOpeningHours(asRecord(shop.opening_hours)),
    acceptedItems: categories,
    amenities: ['Recycling Center'],
    latitude: readNumber(shop.latitude),
    longitude: readNumber(shop.longitude),
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

  return data
    .map((entry) => mapShop(entry))
    .filter((entry): entry is Shop => entry !== null)
}
