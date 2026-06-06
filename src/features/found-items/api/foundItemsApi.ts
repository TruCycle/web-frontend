import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import { env } from '@/shared/lib/config/env'
import type { PaginationMeta } from '@/shared/types/pagination'
import {
  foundItemCategories,
  foundItemStatuses,
  type CreateFoundItemPayload,
  type FoundItemCatalogEntry,
  type FoundItem,
  type FoundItemCategory,
  type FoundItemClaim,
  type FoundItemImage,
  type FoundItemsFilter,
  type FoundItemStatus,
} from '../types'

interface ActorSummary {
  readonly id: string
  readonly name: string
  readonly avatarUrl: string | null
}

interface FoundItemsResponse {
  readonly items: FoundItem[]
  readonly pagination: PaginationMeta
}

interface FoundItemCatalogResponse {
  readonly supportedCategories: FoundItemCategory[]
  readonly entries: FoundItemCatalogEntry[]
}

type FoundItemClaimStatus = FoundItemClaim['status']

const foundItemCategorySet = new Set<FoundItemCategory>(foundItemCategories)
const foundItemStatusSet = new Set<FoundItemStatus>(foundItemStatuses)
const foundItemClaimStatusSet = new Set<FoundItemClaimStatus>([
  'pending',
  'acknowledged',
  'completed',
  'cancelled',
])

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeFoundItemCategory(value: unknown): FoundItemCategory {
  return foundItemCategorySet.has(value as FoundItemCategory)
    ? (value as FoundItemCategory)
    : 'other'
}

function normalizeFoundItemStatus(value: unknown): FoundItemStatus {
  return foundItemStatusSet.has(value as FoundItemStatus)
    ? (value as FoundItemStatus)
    : 'available'
}

function normalizeFoundItemClaimStatus(value: unknown): FoundItemClaimStatus {
  return foundItemClaimStatusSet.has(value as FoundItemClaimStatus)
    ? (value as FoundItemClaimStatus)
    : 'pending'
}

function normalizeFoundItemImage(value: unknown): FoundItemImage | null {
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
    thumbnailUrl: readString(record.thumbnailUrl) ?? url,
    altText: readString(record.altText),
  }
}

function normalizeFoundItemCatalogEntry(value: unknown): FoundItemCatalogEntry | null {
  const record = asRecord(value)
  const sourceCategory = readString(record?.sourceCategory)
  const subcategory = readString(record?.subcategory)
  const item = readString(record?.item)

  if (!sourceCategory || !subcategory || !item) {
    return null
  }

  return {
    sourceCategory,
    subcategory,
    item,
    typicalWeightKg: readNumber(record?.typicalWeightKg) ?? 0,
    estimatedCo2eKg: readNumber(record?.estimatedCo2eKg) ?? 0,
    impactPoints: readNumber(record?.impactPoints) ?? 0,
  }
}

function normalizeActorSummary(value: unknown): FoundItem['poster'] {
  const record = asRecord(value)

  return {
    id: readString(record?.id) ?? '',
    name: readString(record?.name) ?? 'Community member',
    avatarUrl: readString(record?.avatarUrl),
  }
}

function normalizeLocation(value: unknown): FoundItem['location'] {
  const record = asRecord(value)

  return {
    latitude: readNumber(record?.latitude) ?? 0,
    longitude: readNumber(record?.longitude) ?? 0,
    address: readString(record?.address),
    neighborhood: readString(record?.neighborhood),
    postcode: readString(record?.postcode) ?? '',
    approximateDistance: readNumber(record?.approximateDistance),
  }
}

function normalizeFoundItem(value: unknown): FoundItem | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const id = readString(record.id)
  const title = readString(record.title)
  if (!id || !title) {
    return null
  }

  const images = Array.isArray(record.images)
    ? record.images
        .map((entry) => normalizeFoundItemImage(entry))
        .filter((entry): entry is FoundItemImage => entry !== null)
    : []

  return {
    id,
    title,
    description: readString(record.description) ?? '',
    category: normalizeFoundItemCategory(record.category),
    status: normalizeFoundItemStatus(record.status),
    images,
    location: normalizeLocation(record.location),
    condition: readString(record.condition),
    weightKg: readNumber(record.weightKg),
    estimatedCo2eKg: readNumber(record.estimatedCo2eKg) ?? 0,
    impactPoints: readNumber(record.impactPoints) ?? 0,
    isFlyTipped: Boolean(record.isFlyTipped),
    poster: normalizeActorSummary(record.poster),
    postedAt: readString(record.postedAt) ?? new Date().toISOString(),
    expiresAt: readString(record.expiresAt),
    claimCount: readNumber(record.claimCount) ?? 0,
    viewCount: readNumber(record.viewCount) ?? 0,
  }
}

function normalizeFoundItemClaim(value: unknown): FoundItemClaim | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const id = readString(record.id)
  const foundItemId = readString(record.foundItemId)
  const claimerId = readString(record.claimerId)
  const claimerName = readString(record.claimerName)
  if (!id || !foundItemId || !claimerId || !claimerName) {
    return null
  }

  return {
    id,
    foundItemId,
    claimerId,
    claimerName,
    message: readString(record.message),
    status: normalizeFoundItemClaimStatus(record.status),
    createdAt: readString(record.createdAt) ?? new Date().toISOString(),
  }
}

function readPagination(value: unknown, page: number, limit: number, total: number): PaginationMeta {
  const record = asRecord(value)
  const nextPage = readNumber(record?.page) ?? page
  const nextLimit = readNumber(record?.limit) ?? limit
  const nextTotal = readNumber(record?.total) ?? total
  const nextTotalPages = readNumber(record?.totalPages) ?? Math.max(1, Math.ceil(nextTotal / nextLimit))

  return {
    page: Math.max(1, Math.floor(nextPage)),
    limit: Math.max(1, Math.floor(nextLimit)),
    total: Math.max(0, Math.floor(nextTotal)),
    totalPages: Math.max(1, Math.floor(nextTotalPages)),
  }
}

function unwrapFoundItemsResponse(value: unknown, page: number, limit: number): FoundItemsResponse {
  const record = asRecord(value)
  const rawItems = Array.isArray(record?.items) ? record.items : []
  const items = rawItems
    .map((entry) => normalizeFoundItem(entry))
    .filter((entry): entry is FoundItem => entry !== null)

  return {
    items,
    pagination: readPagination(record?.pagination, page, limit, items.length),
  }
}

function requireFoundItem(value: unknown): FoundItem {
  const item = normalizeFoundItem(value)
  if (!item) {
    throw new Error('Invalid found item response.')
  }

  return item
}

function requireFoundItemClaim(value: unknown): FoundItemClaim {
  const claim = normalizeFoundItemClaim(value)
  if (!claim) {
    throw new Error('Invalid found item claim response.')
  }

  return claim
}

function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"]+|['"]+$/g, '')
}

function getCloudinaryUploadUrl(): string {
  const cloudName = stripWrappingQuotes(env.cloudinaryCloudName.trim())
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`
}

export async function fetchFoundItems(
  filters: FoundItemsFilter = {},
  page: number = 1,
  limit: number = 9,
): Promise<FoundItemsResponse> {
  const safeLimit = clampLimit(limit, 9)
  const query = toQueryString({
    category: filters.category,
    status: filters.status,
    maxDistance: filters.maxDistance,
    postcode: filters.postcode?.trim() || undefined,
    sortBy: filters.sortBy,
    page,
    limit: safeLimit,
  })

  const response = await apiRequest<unknown>(`/found-items${query}`)
  return unwrapFoundItemsResponse(unwrapApiData<unknown>(response), page, safeLimit)
}

export async function fetchFoundItemById(
  id: string,
  _viewerId?: string,
): Promise<{ item: FoundItem; claims: FoundItemClaim[]; viewerClaim: FoundItemClaim | null }> {
  const response = await apiRequest<unknown>(`/found-items/${encodeURIComponent(id.trim())}`)
  const record = asRecord(unwrapApiData<unknown>(response))

  return {
    item: requireFoundItem(record?.item),
    claims: Array.isArray(record?.claims)
      ? record.claims
          .map((entry) => normalizeFoundItemClaim(entry))
          .filter((entry): entry is FoundItemClaim => entry !== null)
      : [],
    viewerClaim: normalizeFoundItemClaim(record?.viewerClaim),
  }
}

export async function fetchMyFoundPosts(
  _userId?: string,
  status?: FoundItemStatus,
  page: number = 1,
  limit: number = 12,
): Promise<FoundItemsResponse> {
  const safeLimit = clampLimit(limit, 12)
  const query = toQueryString({
    status,
    page,
    limit: safeLimit,
  })

  const response = await apiRequest<unknown>(`/found-items/my-posts${query}`)
  return unwrapFoundItemsResponse(unwrapApiData<unknown>(response), page, safeLimit)
}

export async function fetchFoundItemCatalog(
  category?: FoundItemCategory,
  search?: string,
  limit: number = 8,
): Promise<FoundItemCatalogResponse> {
  const query = toQueryString({
    category,
    search: search?.trim() || undefined,
    limit,
  })
  const response = await apiRequest<unknown>(`/found-items/catalog${query}`)
  const record = asRecord(unwrapApiData<unknown>(response))

  return {
    supportedCategories: Array.isArray(record?.supportedCategories)
      ? record.supportedCategories.filter((entry): entry is FoundItemCategory => foundItemCategorySet.has(entry as FoundItemCategory))
      : [],
    entries: Array.isArray(record?.entries)
      ? record.entries
          .map((entry) => normalizeFoundItemCatalogEntry(entry))
          .filter((entry): entry is FoundItemCatalogEntry => entry !== null)
      : [],
  }
}

export async function createFoundItem(
  payload: CreateFoundItemPayload,
  _poster?: ActorSummary,
): Promise<FoundItem> {
  const response = await apiRequest<unknown, Record<string, unknown>>('/found-items', {
    method: 'POST',
    body: {
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      condition: payload.condition?.trim() || undefined,
      weightKg: payload.weightKg,
      isFlyTipped: payload.isFlyTipped,
      carbonCatalogSelection: payload.carbonCatalogSelection,
      images: payload.images.map((image) => ({
        url: image.url,
        altText: image.altText?.trim() || payload.title.trim(),
      })),
      location: {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        address: payload.location.address?.trim() || undefined,
        postcode: payload.location.postcode.trim(),
      },
    },
  })

  return requireFoundItem(asRecord(unwrapApiData<unknown>(response))?.item)
}

export async function updateFoundItemStatus(
  id: string,
  status: FoundItemStatus,
): Promise<FoundItem> {
  const response = await apiRequest<unknown, { status: FoundItemStatus }>(
    `/found-items/${encodeURIComponent(id.trim())}/status`,
    {
      method: 'PATCH',
      body: { status },
    },
  )

  return requireFoundItem(asRecord(unwrapApiData<unknown>(response))?.item)
}

export async function deleteFoundItem(id: string): Promise<void> {
  await apiRequest<void>(`/found-items/${encodeURIComponent(id.trim())}`, {
    method: 'DELETE',
  })
}

export async function claimFoundItem(
  id: string,
  _actor?: ActorSummary,
  message?: string,
): Promise<FoundItemClaim> {
  const response = await apiRequest<unknown, { message?: string }>(
    `/found-items/${encodeURIComponent(id.trim())}/claim`,
    {
      method: 'POST',
      body: {
        message: message?.trim() || undefined,
      },
    },
  )

  return requireFoundItemClaim(asRecord(unwrapApiData<unknown>(response))?.claim)
}

export async function cancelFoundItemClaim(
  id: string,
  _claimerId: string = 'current-user',
): Promise<void> {
  await apiRequest<void>(`/found-items/${encodeURIComponent(id.trim())}/claim`, {
    method: 'DELETE',
  })
}

export async function reportFoundItem(
  id: string,
  reason: string,
  details?: string,
): Promise<void> {
  await apiRequest<unknown, { reason: string; details?: string }>(
    `/found-items/${encodeURIComponent(id.trim())}/report`,
    {
      method: 'POST',
      body: {
        reason: reason.trim(),
        details: details?.trim() || undefined,
      },
    },
  )
}

export async function uploadFoundItemImage(file: File): Promise<{
  url: string
  thumbnailUrl: string
}> {
  const cloudName = stripWrappingQuotes(env.cloudinaryCloudName.trim())
  const uploadPreset = stripWrappingQuotes(env.cloudinaryUploadPreset.trim())
  const folder = stripWrappingQuotes(env.cloudinaryFolder.trim())

  if (!cloudName || !uploadPreset) {
    throw new Error('Image upload is unavailable. Missing Cloudinary env values.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  if (folder) {
    formData.append('folder', folder)
  }

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Unable to upload image right now.')
  }

  const payload = (await response.json()) as Record<string, unknown>
  const url = readString(payload.secure_url) ?? readString(payload.url)
  if (!url) {
    throw new Error('Image upload succeeded but no URL was returned.')
  }

  return {
    url,
    thumbnailUrl: url,
  }
}