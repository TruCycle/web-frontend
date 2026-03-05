import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import type {
  DonorListingItem,
  ListingClaim,
  ListingCollector,
  ListingStatus,
  ListingsPagination,
} from '@/features/listings/types'

interface FetchDonorListingsParams {
  readonly page?: number
  readonly limit?: number
  readonly status?: string
}

interface DonorListingsResponse {
  readonly items: DonorListingItem[]
  readonly pagination: ListingsPagination
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

function readCollectorName(value: Record<string, unknown>): string {
  const explicitName = readString(value.name)
  if (explicitName) {
    return explicitName
  }

  const firstName =
    readString(value.firstName) ??
    readString(value.first_name) ??
    ''
  const lastName =
    readString(value.lastName) ??
    readString(value.last_name) ??
    ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || 'Unknown collector'
}

function mapCollector(value: unknown): ListingCollector | null {
  const collector = asRecord(value)
  const id = readString(collector?.id)
  if (!collector || !id) {
    return null
  }

  return {
    id,
    name: readCollectorName(collector),
    profileImageUrl:
      readString(collector.profile_image) ?? readString(collector.profileImageUrl),
  }
}

function mapClaim(value: unknown): ListingClaim | null {
  const claim = asRecord(value)
  if (!claim) {
    return null
  }

  const id = readString(claim.id) ?? readString(claim.claim_id)
  const status = readString(claim.status) ?? readString(claim.claim_status)
  if (!id || !status) {
    return null
  }

  return {
    id,
    status,
    message:
      readString(claim.message) ??
      readString(claim.note) ??
      readString(claim.notes),
    createdAt: readString(claim.created_at) ?? readString(claim.claim_created_at),
    approvedAt: readString(claim.approved_at) ?? readString(claim.claim_approved_at),
    completedAt: readString(claim.completed_at) ?? readString(claim.claim_completed_at),
    collector:
      mapCollector(claim.collector) ??
      mapCollector(claim.requester) ??
      mapCollector(claim.user),
  }
}

function toTimestamp(value: string | null): number {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function byMostRecentClaimDate(first: ListingClaim, second: ListingClaim): number {
  const firstTimestamp = Math.max(
    toTimestamp(first.completedAt),
    toTimestamp(first.approvedAt),
    toTimestamp(first.createdAt),
  )
  const secondTimestamp = Math.max(
    toTimestamp(second.completedAt),
    toTimestamp(second.approvedAt),
    toTimestamp(second.createdAt),
  )

  return secondTimestamp - firstTimestamp
}

function mapClaims(item: Record<string, unknown>): ListingClaim[] {
  const entries: unknown[] = []

  if (Array.isArray(item.claims)) {
    entries.push(...item.claims)
  }
  if (Array.isArray(item.claim_requests)) {
    entries.push(...item.claim_requests)
  }
  if (Array.isArray(item.collector_requests)) {
    entries.push(...item.collector_requests)
  }
  if (item.claim) {
    entries.push(item.claim)
  }

  const mapped = entries
    .map((entry) => mapClaim(entry))
    .filter((entry): entry is ListingClaim => entry !== null)

  const deduped = mapped.reduce<ListingClaim[]>((current, nextClaim) => {
    if (current.some((entry) => entry.id === nextClaim.id)) {
      return current
    }

    return [...current, nextClaim]
  }, [])

  return deduped.sort(byMostRecentClaimDate)
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

function mapMeta(item: Record<string, unknown>, claimStatus: string | null): string {
  const normalizedClaimStatus = claimStatus?.toLowerCase()
  const co2Saved = readNumber(item.estimated_co2_saved_kg)

  if (normalizedClaimStatus === 'approved') {
    return 'Claim approved, awaiting collection'
  }
  if (normalizedClaimStatus === 'pending_approval') {
    return 'Claim request pending approval'
  }
  if (normalizedClaimStatus === 'complete' || normalizedClaimStatus === 'completed') {
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

  const claims = mapClaims(item)
  const primaryClaim = claims[0] ?? null
  const fallbackClaim = asRecord(item.claim)
  const claimStatus =
    primaryClaim?.status ??
    readString(fallbackClaim?.status) ??
    readString(fallbackClaim?.claim_status)
  const rawStatus = readString(item.status) ?? 'unknown'
  const image = Array.isArray(item.images) ? asRecord(item.images[0]) : null
  const metadata = asRecord(item.metadata)
  const description = readString(item.description) ?? readString(metadata?.description)

  return {
    id,
    title,
    status: mapStatus(rawStatus, claimStatus),
    pickupOption: readString(item.pickup_option) ?? 'exchange',
    category: readString(item.category) ?? 'Uncategorized',
    condition: readString(item.condition) ?? 'Unknown',
    meta: mapMeta(item, claimStatus),
    description,
    imageUrl: readString(image?.url),
    qrCode: readString(item.qr_code),
    rawStatus,
    claimStatus,
    createdAt: readString(item.created_at) ?? readString(item.createdAt),
    reward: readNumber(item.reward),
    rewardCurrency: readString(item.reward_currency),
    co2SavedKg: readNumber(item.estimated_co2_saved_kg),
    claims,
  }
}

export async function fetchDonorListings(
  params: FetchDonorListingsParams = {},
): Promise<DonorListingsResponse> {
  const requestedPage = params.page ?? 1
  const requestedLimit = clampLimit(params.limit, 20)
  const query = toQueryString({
    page: requestedPage,
    limit: requestedLimit,
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

  const mappedItems = items
    .map((entry) => mapListing(entry))
    .filter((entry): entry is DonorListingItem => entry !== null)

  const paginationRecord = asRecord(payload?.pagination)
  const page = Math.max(1, Math.trunc(readNumber(paginationRecord?.page) ?? requestedPage))
  const limit = Math.max(1, Math.trunc(readNumber(paginationRecord?.limit) ?? requestedLimit))
  const total = Math.max(0, Math.trunc(readNumber(paginationRecord?.total) ?? mappedItems.length))
  const totalPages = Math.max(
    1,
    Math.trunc(
      readNumber(paginationRecord?.total_pages) ??
        Math.ceil(total / limit),
    ),
  )

  return {
    items: mappedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export async function removeDonorListing(listingId: string): Promise<void> {
  await apiRequest<void>(`/items/${listingId}`, {
    method: 'DELETE',
  })
}

export async function approveDonorListingClaim(claimId: string): Promise<void> {
  await apiRequest<void>(`/claims/${claimId}/approve`, {
    method: 'PATCH',
  })
}
