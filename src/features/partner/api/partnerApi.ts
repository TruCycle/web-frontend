import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import type {
  CreatePartnerShopPayload,
  FetchPartnerItemsParams,
  PartnerQrActionResult,
  PartnerQrClaimContext,
  PartnerQrItemContext,
  PartnerQrScanEvent,
  PartnerQrScanResult,
  PartnerItemsResponse,
  PartnerManagedItem,
  PartnerOpeningHours,
  PartnerShop,
  UpdatePartnerShopPayload,
} from '@/features/partner/types'

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

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function mapOpeningHours(value: unknown): PartnerOpeningHours | null {
  const openingHours = asRecord(value)
  if (!openingHours) {
    return null
  }

  const days = Array.isArray(openingHours.days)
    ? openingHours.days.filter((day): day is string => typeof day === 'string' && day.trim().length > 0)
    : []
  const openTime = readString(openingHours.open_time) ?? readString(openingHours.openTime)
  const closeTime = readString(openingHours.close_time) ?? readString(openingHours.closeTime)

  if (!openTime || !closeTime || days.length === 0) {
    return null
  }

  return {
    days,
    openTime,
    closeTime,
  }
}

function readCollectorName(claim: Record<string, unknown>): string | null {
  const collector = asRecord(claim.collector)
  if (!collector) {
    return null
  }

  const explicitName = readString(collector.name)
  if (explicitName) {
    return explicitName
  }

  const firstName = readString(collector.first_name) ?? readString(collector.firstName) ?? ''
  const lastName = readString(collector.last_name) ?? readString(collector.lastName) ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || null
}

function mapShop(value: unknown): PartnerShop | null {
  const shop = asRecord(value)
  if (!shop) {
    return null
  }

  const id = readString(shop.id)
  const name = readString(shop.name)
  const addressLine = readString(shop.address_line) ?? readString(shop.addressLine)
  const postcode = readString(shop.postcode)

  if (!id || !name || !addressLine || !postcode) {
    return null
  }

  const acceptableCategories = Array.isArray(shop.acceptable_categories)
    ? shop.acceptable_categories.filter(
        (category): category is string => typeof category === 'string' && category.trim().length > 0,
      )
    : []

  return {
    id,
    name,
    phoneNumber: readString(shop.phone_number) ?? readString(shop.phoneNumber),
    addressLine,
    postcode,
    operationalNotes:
      readString(shop.operational_notes) ?? readString(shop.operationalNotes),
    latitude: readNumber(shop.latitude),
    longitude: readNumber(shop.longitude),
    openingHours: mapOpeningHours(shop.opening_hours ?? shop.openingHours),
    acceptableCategories,
    active: readBoolean(shop.active) ?? false,
    createdAt: readString(shop.created_at) ?? readString(shop.createdAt),
    updatedAt: readString(shop.updated_at) ?? readString(shop.updatedAt),
  }
}

function mapPartnerItem(value: unknown): PartnerManagedItem | null {
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
  const firstImage = Array.isArray(item.images) ? asRecord(item.images[0]) : null
  const dropoffLocation = asRecord(item.dropoff_location)

  return {
    id,
    title,
    status: readString(item.status) ?? 'unknown',
    pickupOption: readString(item.pickup_option) ?? 'unknown',
    category: readString(item.category) ?? 'Uncategorized',
    qrCode: readString(item.qr_code),
    imageUrl: readString(firstImage?.url),
    estimatedCo2SavedKg: readNumber(item.estimated_co2_saved_kg),
    createdAt: readString(item.created_at) ?? readString(item.createdAt),
    claimStatus: readString(claim?.status),
    claimApprovedAt: readString(claim?.approved_at),
    claimCompletedAt: readString(claim?.completed_at),
    collectorName: claim ? readCollectorName(claim) : null,
    shopId: readString(dropoffLocation?.id),
    shopName: readString(dropoffLocation?.name),
  }
}

function mapPartnerQrScanEvent(value: unknown): PartnerQrScanEvent | null {
  const scanEvent = asRecord(value)
  if (!scanEvent) {
    return null
  }

  const scanType = readString(scanEvent.scan_type) ?? readString(scanEvent.scanType)
  if (!scanType) {
    return null
  }

  return {
    scanType,
    shopId: readString(scanEvent.shop_id) ?? readString(scanEvent.shopId),
    scannedAt: readString(scanEvent.scanned_at) ?? readString(scanEvent.scannedAt),
  }
}

function mapPartnerQrClaim(value: unknown): PartnerQrClaimContext | null {
  const claim = asRecord(value)
  if (!claim) {
    return null
  }

  return {
    id: readString(claim.id),
    status: readString(claim.status),
    collectorId: readString(claim.collector_id) ?? readString(claim.collectorId),
  }
}

function mapPartnerQrItemContext(value: unknown): PartnerQrItemContext | null {
  const payload = asRecord(value)
  if (!payload) {
    return null
  }

  const item = asRecord(payload.item) ?? payload
  const id = readString(item.id) ?? readString(payload.id)
  if (!id) {
    return null
  }

  const claim = mapPartnerQrClaim(item.claim ?? payload.claim)
  const dropoffLocation = asRecord(item.dropoff_location) ?? asRecord(payload.dropoff_location)
  const scanEventsSource = Array.isArray(item.scan_events)
    ? item.scan_events
    : Array.isArray(payload.scan_events)
      ? payload.scan_events
      : []

  return {
    id,
    title: readString(item.title),
    category: readString(item.category),
    condition: readString(item.condition),
    status: readString(item.status) ?? 'unknown',
    pickupOption: readString(item.pickup_option) ?? 'unknown',
    qrCode: readString(item.qr_code),
    createdAt: readString(item.created_at) ?? readString(item.createdAt),
    shopId: readString(dropoffLocation?.id),
    shopName: readString(dropoffLocation?.name),
    claim,
    scanEvents: scanEventsSource
      .map((scanEvent) => mapPartnerQrScanEvent(scanEvent))
      .filter((scanEvent): scanEvent is PartnerQrScanEvent => scanEvent !== null),
  }
}

function mapPartnerQrActionResult(value: unknown): PartnerQrActionResult {
  const payload = asRecord(value)
  const scanEventsSource = Array.isArray(payload?.scan_events) ? payload.scan_events : []

  return {
    scanType: readString(payload?.scan_type) ?? readString(payload?.scanType),
    scanResult: readString(payload?.scan_result) ?? readString(payload?.scanResult),
    itemStatus: readString(payload?.item_status) ?? readString(payload?.itemStatus),
    claimStatus: readString(payload?.status),
    completedAt: readString(payload?.completed_at) ?? readString(payload?.completedAt),
    scannedAt: readString(payload?.scanned_at) ?? readString(payload?.scannedAt),
    scanEvents: scanEventsSource
      .map((scanEvent) => mapPartnerQrScanEvent(scanEvent))
      .filter((scanEvent): scanEvent is PartnerQrScanEvent => scanEvent !== null),
  }
}

function readQrScanItemId(payload: Record<string, unknown> | null): string | null {
  if (!payload) {
    return null
  }

  return (
    readString(payload.item_id) ??
    readString(payload.itemId) ??
    readString(asRecord(payload.item)?.id) ??
    null
  )
}

function mapShopPayload(
  payload: CreatePartnerShopPayload | UpdatePartnerShopPayload,
): Record<string, unknown> {
  const openingHours = payload.openingHours
    ? {
        days: payload.openingHours.days,
        open_time: payload.openingHours.openTime,
        close_time: payload.openingHours.closeTime,
      }
    : undefined

  return {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.addressLine !== undefined ? { address_line: payload.addressLine } : {}),
    ...(payload.postcode !== undefined ? { postcode: payload.postcode } : {}),
    ...(payload.phoneNumber !== undefined ? { phone_number: payload.phoneNumber } : {}),
    ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
    ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
    ...(payload.operationalNotes !== undefined
      ? { operational_notes: payload.operationalNotes }
      : {}),
    ...(payload.acceptableCategories !== undefined
      ? { acceptable_categories: payload.acceptableCategories }
      : {}),
    ...(openingHours ? { opening_hours: openingHours } : {}),
    ...('active' in payload && payload.active !== undefined ? { active: payload.active } : {}),
  }
}

export async function fetchMyPartnerShops(): Promise<PartnerShop[]> {
  const response = await apiRequest<unknown>('/shops/me')
  const data = unwrapApiData<unknown>(response)
  const shopsCollection = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.items)
      ? (asRecord(data)?.items as unknown[])
      : []

  return shopsCollection
    .map((shop) => mapShop(shop))
    .filter((shop): shop is PartnerShop => shop !== null)
}

export async function createPartnerShop(
  payload: CreatePartnerShopPayload,
): Promise<PartnerShop> {
  const response = await apiRequest<unknown, Record<string, unknown>>('/shops', {
    method: 'POST',
    body: mapShopPayload(payload),
  })
  const data = unwrapApiData<unknown>(response)
  const shop = mapShop(data)

  if (!shop) {
    throw new Error('Unexpected create shop response payload')
  }

  return shop
}

export async function updatePartnerShop(
  shopId: string,
  payload: UpdatePartnerShopPayload,
): Promise<PartnerShop> {
  const response = await apiRequest<unknown, Record<string, unknown>>(`/shops/${shopId}`, {
    method: 'PATCH',
    body: mapShopPayload(payload),
  })
  const data = unwrapApiData<unknown>(response)
  const shop = mapShop(data)

  if (!shop) {
    throw new Error('Unexpected update shop response payload')
  }

  return shop
}

export async function fetchPartnerItems(
  params: FetchPartnerItemsParams = {},
): Promise<PartnerItemsResponse> {
  const requestedPage = params.page ?? 1
  const requestedLimit = clampLimit(params.limit, 10)
  const query = toQueryString({
    status: params.status,
    pickup_option: params.pickupOption,
    category: params.category,
    page: requestedPage,
    limit: requestedLimit,
  })

  const response = await apiRequest<unknown>(`/shops/me/items${query}`)
  const data = unwrapApiData<unknown>(response)
  const payload = asRecord(data)
  const itemsCollection = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(data)
      ? data
      : []

  const items = itemsCollection
    .map((item) => mapPartnerItem(item))
    .filter((item): item is PartnerManagedItem => item !== null)

  const paginationRecord = asRecord(payload?.pagination)
  const page = Math.max(1, Math.trunc(readNumber(paginationRecord?.page) ?? requestedPage))
  const limit = Math.max(1, Math.trunc(readNumber(paginationRecord?.limit) ?? requestedLimit))
  const total = Math.max(0, Math.trunc(readNumber(paginationRecord?.total) ?? items.length))
  const totalPages = Math.max(
    1,
    Math.trunc(readNumber(paginationRecord?.total_pages) ?? Math.ceil(total / limit)),
  )

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export async function scanPartnerQrCode(payload: {
  readonly qrPayload: string
  readonly direction: 'in' | 'out'
  readonly shopId?: string
}): Promise<PartnerQrScanResult> {
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
    itemId: readQrScanItemId(data),
  }
}

export async function fetchPartnerQrItemContext(itemId: string): Promise<PartnerQrItemContext> {
  const response = await apiRequest<unknown>(`/qr/item/${encodeURIComponent(itemId)}/view`)
  const data = unwrapApiData<unknown>(response)
  const itemContext = mapPartnerQrItemContext(data)

  if (!itemContext) {
    throw new Error('Unable to load item details from scanned QR code.')
  }

  return itemContext
}

export async function confirmPartnerDropoff(
  itemId: string,
  shopId: string,
): Promise<PartnerQrActionResult> {
  const response = await apiRequest<unknown, { shop_id: string; action: 'accept' }>(
    `/qr/item/${encodeURIComponent(itemId)}/dropoff-in`,
    {
      method: 'POST',
      body: {
        shop_id: shopId,
        action: 'accept',
      },
    },
  )

  return mapPartnerQrActionResult(unwrapApiData<unknown>(response))
}

export async function completePartnerPickup(
  itemId: string,
  shopId: string,
): Promise<PartnerQrActionResult> {
  const response = await apiRequest<unknown, { shop_id: string }>(
    `/qr/item/${encodeURIComponent(itemId)}/claim-out`,
    {
      method: 'POST',
      body: { shop_id: shopId },
    },
  )

  return mapPartnerQrActionResult(unwrapApiData<unknown>(response))
}
