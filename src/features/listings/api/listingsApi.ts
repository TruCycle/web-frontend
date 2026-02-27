import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import type { DonorListingItem, ListingStatus } from '@/features/listings/types'

interface FetchDonorListingsParams {
  readonly page?: number
  readonly limit?: number
  readonly status?: string
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

function mapStatus(itemStatus: string, claimStatus: string | null): ListingStatus {
  const normalizedStatus = itemStatus.toLowerCase()
  const normalizedClaimStatus = claimStatus?.toLowerCase()

  if (
    normalizedStatus === 'collected' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'recycled' ||
    normalizedClaimStatus === 'complete' ||
    normalizedClaimStatus === 'completed'
  ) {
    return 'Completed'
  }

  if (
    normalizedClaimStatus === 'approved' ||
    normalizedClaimStatus === 'pending_approval' ||
    normalizedClaimStatus === 'pending_dropoff' ||
    normalizedClaimStatus === 'pending_collection'
  ) {
    return 'Claimed'
  }

  return 'Active'
}

function mapMeta(item: Record<string, unknown>): string {
  const claim = asRecord(item.claim)
  const claimStatus = readString(claim?.status)
  const co2Saved = readNumber(item.estimated_co2_saved_kg)

  if (claimStatus === 'approved') {
    return 'Claim approved, awaiting collection'
  }
  if (claimStatus === 'pending_approval') {
    return 'Claim request pending approval'
  }
  if (claimStatus === 'complete' || claimStatus === 'completed') {
    return co2Saved !== null ? `${co2Saved.toFixed(1)}kg CO2 saved` : 'Collection completed'
  }
  if (co2Saved !== null) {
    return `${co2Saved.toFixed(1)}kg CO2 potential impact`
  }

  return 'Waiting for collectors'
}

function mapListing(value: unknown): DonorListingItem | null {
  const item = asRecord(value)
  if (!item) {
    return null
  }

  const id = readString(item.id)
  const title = readString(item.title)
  if (!id || !title) {
    return null
  }

  const claim = asRecord(item.claim)
  const claimStatus = readString(claim?.status)
  const rawStatus = readString(item.status) ?? 'unknown'
  const image = Array.isArray(item.images) ? asRecord(item.images[0]) : null

  return {
    id,
    title,
    status: mapStatus(rawStatus, claimStatus),
    category: readString(item.category) ?? 'Uncategorized',
    condition: readString(item.condition) ?? 'Unknown',
    meta: mapMeta(item),
    imageUrl: readString(image?.url),
    rawStatus,
    claimStatus,
    co2SavedKg: readNumber(item.estimated_co2_saved_kg),
  }
}

export async function fetchDonorListings(
  params: FetchDonorListingsParams = {},
): Promise<DonorListingItem[]> {
  const query = toQueryString({
    page: params.page ?? 1,
    limit: clampLimit(params.limit, 20),
    status: params.status,
  })

  const response = await apiRequest<unknown>(`/items/me/listed${query}`)
  const data = unwrapApiData<unknown>(response)
  const payload = asRecord(data)
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(data)
      ? data
      : []

  return items
    .map((entry) => mapListing(entry))
    .filter((entry): entry is DonorListingItem => entry !== null)
}

export async function removeDonorListing(listingId: string): Promise<void> {
  await apiRequest<void>(`/items/${listingId}`, {
    method: 'DELETE',
  })
}
