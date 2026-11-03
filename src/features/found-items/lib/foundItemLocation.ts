import type { FoundItemLocation } from '../types'

import { outwardPostcode } from '@/shared/utils/outwardPostcode'
export { outwardPostcode } from '@/shared/utils/outwardPostcode'

export function foundItemMapPoint(location: Pick<FoundItemLocation, 'latitude' | 'longitude'>): { latitude: number; longitude: number } | null {
  const { latitude, longitude } = location
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    ? { latitude, longitude } : null
}

export function decodeFoundItemLocation(value: unknown): FoundItemLocation {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const text = (input: unknown) => typeof input === 'string' && input.trim() ? input.trim() : null
  const recognized = record.precision === 'exact' || record.precision === 'approximate'
  // An older server without the privacy contract must not be labelled safe or
  // silently expose its exact pin as an approximate one. Paired release required.
  const point = recognized ? foundItemMapPoint({ latitude: record.latitude as number | null, longitude: record.longitude as number | null }) : null
  const precision = point && recognized ? record.precision as 'exact' | 'approximate' : 'unavailable'
  const exact = precision === 'exact'
  return {
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
    precision,
    address: exact ? text(record.address) : null,
    neighborhood: exact ? text(record.neighborhood) : null,
    postcode: exact ? text(record.postcode) ?? '' : outwardPostcode(record.postcode),
    approximateDistance: point && typeof record.approximateDistance === 'number' && Number.isFinite(record.approximateDistance) && record.approximateDistance >= 0 ? record.approximateDistance : null,
  }
}

export function formatApproximateDistance(distanceKm: number | null): string {
  if (distanceKm === null || !Number.isFinite(distanceKm) || distanceKm < 0) return 'Distance unavailable'
  return distanceKm < 1 ? 'Less than 1 km away (approx.)' : `About ${Math.round(distanceKm)} km away`
}
