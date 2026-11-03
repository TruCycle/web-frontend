import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import { outwardPostcode } from '@/shared/utils/outwardPostcode'
import { ApiError } from '@/shared/types/network'
import type {
  BrowseItem,
  CollectedItemsResponse,
  CollectedItem,
  ImpactMetrics,
  ItemImage,
  QrScanResult,
  WalletBalance,
} from '@/features/items/types'

interface FetchBrowseItemsParams {
  readonly category?: string
  readonly search?: string
  readonly postcode?: string
  readonly page?: number
  readonly limit?: number
  readonly includeAuth?: boolean
}

interface FetchCollectedItemsParams {
  readonly page?: number
  readonly limit?: number
  readonly claimStatus?: string
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

function normalizeImage(value: unknown): ItemImage | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const url = readString(record.url)
  if (!url) {
    return null
  }

  return {
    url,
    altText: readString(record.altText) ?? readString(record.alt_text),
  }
}

function formatOwnerName(owner: Record<string, unknown> | null): string {
  if (!owner) {
    return 'Unknown donor'
  }

  const explicitName = readString(owner.name)
  if (explicitName) {
    return explicitName
  }

  const firstName = readString(owner.firstName) ?? readString(owner.first_name) ?? ''
  const lastName = readString(owner.lastName) ?? readString(owner.last_name) ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || 'Unknown donor'
}

function formatLocationLabel(item: Record<string, unknown> | null): string {
  if (!item) {
    return 'Unknown location'
  }

  const location = asRecord(item.location)
  const postcode = outwardPostcode(location?.postcode)
  // Public list labels never inherit exact owner fields or legacy addresses.
  const base = postcode ? `Area ${postcode}` : 'Location unavailable'
  const distanceKm = readNumber(item.distance_km)
  if (location?.precision !== 'approximate' || distanceKm === null || distanceKm < 0) return base
  return `${base} - ${distanceKm < 1 ? 'Less than 1 km away (approx.)' : `About ${Math.round(distanceKm)} km away`}`
}

function mapBrowseItem(value: unknown): BrowseItem | null {
  const item = asRecord(value)
  if (!item) {
    return null
  }

  const id = readString(item.id)
  const title = readString(item.title)
  if (!id || !title) {
    return null
  }

  const images = Array.isArray(item.images) ? item.images : []
  const firstImage = images
    .map((image) => normalizeImage(image))
    .find((image): image is ItemImage => image !== null)
  const owner = asRecord(item.owner)
  const claim = asRecord(item.claim)

  return {
    id,
    title,
    category: readString(item.category) ?? 'Uncategorized',
    condition: readString(item.condition) ?? 'Unknown',
    status: readString(item.status) ?? 'unknown',
    pickupOption: readString(item.pickup_option) ?? 'exchange',
    locationPrecision: asRecord(item.location)?.precision === 'approximate' ? 'approximate' : 'unavailable',
    distanceKm: asRecord(item.location)?.precision === 'approximate' && (readNumber(item.distance_km) ?? -1) >= 0 ? readNumber(item.distance_km) : null,
    locationLabel: formatLocationLabel(item),
    image: firstImage ?? null,
    estimatedCo2SavedKg: readNumber(item.estimated_co2_saved_kg),
    ownerName: formatOwnerName(owner),
    claimStatus: readString(claim?.status),
  }
}

function mapCollectedItem(value: unknown): CollectedItem | null {
  const claim = asRecord(value)
  const item = asRecord(claim?.item)
  if (!claim || !item) {
    return null
  }

  const claimId = readString(claim.claim_id) ?? readString(claim.id)
  const itemId = readString(item.id)
  const title = readString(item.title)
  if (!claimId || !itemId || !title) {
    return null
  }

  const images = Array.isArray(item.images) ? item.images : []
  const firstImage = images
    .map((image) => normalizeImage(image))
    .find((image): image is ItemImage => image !== null)
  const owner = asRecord(item.owner)
  const dropoffLocation = asRecord(item.dropoff_location)

  return {
    claimId,
    claimStatus: readString(claim.claim_status) ?? 'unknown',
    claimCreatedAt: readString(claim.claim_created_at),
    claimApprovedAt: readString(claim.claim_approved_at),
    claimCompletedAt: readString(claim.claim_completed_at),
    reward: readNumber(claim.reward),
    rewardCurrency: readString(claim.reward_currency),
    item: {
      id: itemId,
      title,
      category: readString(item.category) ?? 'Uncategorized',
      condition: readString(item.condition) ?? 'Unknown',
      status: readString(item.status) ?? 'unknown',
      pickupOption: readString(item.pickup_option) ?? 'exchange',
      qrCode: readString(item.qr_code),
      image: firstImage ?? null,
      ownerName: formatOwnerName(owner),
      locationLabel: formatLocationLabel(item),
      dropoffLocationId: readString(dropoffLocation?.id),
    },
  }
}

function matchesSearch(item: BrowseItem, search: string): boolean {
  const searchText = search.trim().toLowerCase()
  if (!searchText) {
    return true
  }

  return (
    item.title.toLowerCase().includes(searchText) ||
    item.category.toLowerCase().includes(searchText) ||
    item.locationLabel.toLowerCase().includes(searchText) ||
    item.ownerName.toLowerCase().includes(searchText)
  )
}

export async function fetchBrowseItems(
  params: FetchBrowseItemsParams = {},
): Promise<BrowseItem[]> {
  const safeLimit = clampLimit(params.limit, 24)
  const query = toQueryString({
    status: 'active',
    category:
      params.category && params.category.toLowerCase() !== 'all items'
        ? params.category.toLowerCase()
        : undefined,
    postcode: params.postcode?.trim() || undefined,
    page: params.page ?? 1,
    limit: safeLimit,
  })

  const response = await apiRequest<unknown>(`/items${query}`, {
    includeAuth: params.includeAuth,
  })
  const data = unwrapApiData<unknown>(response)
  const collection = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.items)
      ? (asRecord(data)?.items as unknown[])
      : []

  return collection
    .map((entry) => mapBrowseItem(entry))
    .filter((entry): entry is BrowseItem => entry !== null)
    .filter((entry) => matchesSearch(entry, params.search ?? ''))
}

/** Public deep links always use the guest projection, even in a signed-in tab. */
export async function fetchPublicItem(itemId: string): Promise<BrowseItem> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) throw new ApiError('Item unavailable', 404)
  const normalizedId = itemId.toLowerCase()
  const response = await apiRequest<unknown>(`/items/${normalizedId}`, { includeAuth: false, skipSessionRecovery: true })
  const item = mapBrowseItem(unwrapApiData<unknown>(response))
  if (!item || item.id.toLowerCase() !== normalizedId) throw new ApiError('Item unavailable', 404)
  return item
}

export async function createItemClaim(itemId: string): Promise<void> {
  await apiRequest<unknown, { item_id: string }>('/claims', {
    method: 'POST',
    body: { item_id: itemId },
  })
}

export async function fetchCollectedItems(
  params: FetchCollectedItemsParams = {},
): Promise<CollectedItemsResponse> {
  const requestedPage = params.page ?? 1
  const requestedLimit = clampLimit(params.limit, 10)
  const query = toQueryString({
    page: requestedPage,
    limit: requestedLimit,
    claim_status: params.claimStatus,
  })

  const response = await apiRequest<unknown>(`/items/me/collected${query}`)
  const data = unwrapApiData<unknown>(response)
  const payloadRecord = asRecord(data)
  const items = Array.isArray(payloadRecord?.items)
    ? payloadRecord.items
    : Array.isArray(data)
      ? data
      : []

  const mappedItems = items
    .map((entry) => mapCollectedItem(entry))
    .filter((entry): entry is CollectedItem => entry !== null)

  const paginationRecord = asRecord(payloadRecord?.pagination)
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

export async function fetchImpactMetrics(): Promise<ImpactMetrics> {
  const response = await apiRequest<unknown>('/items/me/impact')
  const data = asRecord(unwrapApiData<unknown>(response))

  return {
    totalCo2SavedKg: readNumber(data?.total_co2_saved_kg) ?? 0,
    itemsExchanged: readNumber(data?.items_exchanged) ?? 0,
    itemsDonated: readNumber(data?.items_donated) ?? 0,
    monthlyGoalProgressPercent:
      readNumber(asRecord(data?.monthly_goal)?.progress_percent) ?? 0,
  }
}

export async function fetchWalletBalance(): Promise<WalletBalance> {
  const response = await apiRequest<unknown>('/rewards/wallet')
  const data = asRecord(unwrapApiData<unknown>(response))
  const balance =
    readNumber(data?.balance) ??
    readNumber(data?.points) ??
    readNumber(data?.available) ??
    0
  const currency =
    readString(data?.currency) ??
    readString(data?.unit) ??
    readString(data?.symbol) ??
    'PTS'

  return { balance, currency }
}

export async function scanQrCode(payload: {
  readonly qrPayload: string
  readonly direction: 'in' | 'out'
  readonly shopId?: string
}): Promise<QrScanResult> {
  const idempotencyKey = crypto.randomUUID()
  const response = await apiRequest<unknown, Record<string, unknown>>('/qr/scan', {
    method: 'POST',
    body: {
      qrPayload: payload.qrPayload,
      direction: payload.direction,
      ...(payload.shopId ? { shopId: payload.shopId } : {}),
    },
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  })

  const data = asRecord(unwrapApiData<unknown>(response))
  return {
    accepted: Boolean(data?.accepted),
    duplicate: Boolean(data?.duplicate),
    idempotencyKey: readString(data?.idempotencyKey),
    direction: payload.direction,
  }
}

export async function collectItem(itemId: string, shopId?: string): Promise<void> {
  await apiRequest<unknown, { shop_id?: string }>(`/items/${itemId}/collect`, {
    method: 'POST',
    body: shopId ? { shop_id: shopId } : {},
  })
}
