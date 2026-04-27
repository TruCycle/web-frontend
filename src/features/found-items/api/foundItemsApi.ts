import type { PaginationMeta } from '@/shared/types/pagination'
import type {
  CreateFoundItemPayload,
  FoundItem,
  FoundItemClaim,
  FoundItemsFilter,
  FoundItemStatus,
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

interface FoundItemsStore {
  items: FoundItem[]
  claimsByItemId: Record<string, FoundItemClaim[]>
}

const defaultActor: ActorSummary = {
  id: 'current-user',
  name: 'You',
  avatarUrl: null,
}

let store: FoundItemsStore = {
  items: [
    {
      id: 'found-1',
      title: 'Oak side table',
      description: 'Dry, sturdy and ready for pickup by the gate.',
      category: 'furniture',
      status: 'available',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=600&q=80',
          altText: 'Oak side table outdoors',
        },
      ],
      location: {
        latitude: 51.5078,
        longitude: -0.1274,
        address: 'Near St. Martin Lane',
        neighborhood: 'Covent Garden',
        postcode: 'WC2N',
        approximateDistance: 0.4,
      },
      condition: 'Good',
      poster: {
        id: 'neighbor-1',
        name: 'Amina',
        avatarUrl: null,
      },
      postedAt: '2026-04-27T07:15:00.000Z',
      expiresAt: '2026-05-02T07:15:00.000Z',
      claimCount: 0,
      viewCount: 42,
    },
    {
      id: 'found-2',
      title: 'Plant stand',
      description: 'Metal frame. Needs a wipe down but solid.',
      category: 'outdoor',
      status: 'claimed',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80',
          altText: 'Black metal plant stand',
        },
      ],
      location: {
        latitude: 51.5131,
        longitude: -0.1402,
        address: 'Outside the corner shop',
        neighborhood: 'Soho',
        postcode: 'W1F',
        approximateDistance: 1.2,
      },
      condition: 'Fair',
      poster: {
        id: 'current-user',
        name: 'You',
        avatarUrl: null,
      },
      postedAt: '2026-04-26T17:10:00.000Z',
      expiresAt: '2026-05-01T17:10:00.000Z',
      claimCount: 1,
      viewCount: 63,
    },
    {
      id: 'found-3',
      title: 'Stack of novels',
      description: 'Eight paperbacks in a clean tote bag.',
      category: 'books',
      status: 'available',
      images: [],
      location: {
        latitude: 51.5195,
        longitude: -0.1024,
        address: 'Next to the blue recycling bins',
        neighborhood: 'Clerkenwell',
        postcode: 'EC1M',
        approximateDistance: 2.1,
      },
      condition: 'Good',
      poster: {
        id: 'neighbor-2',
        name: 'Jordan',
        avatarUrl: null,
      },
      postedAt: '2026-04-27T05:45:00.000Z',
      expiresAt: '2026-05-04T05:45:00.000Z',
      claimCount: 0,
      viewCount: 19,
    },
  ],
  claimsByItemId: {
    'found-2': [
      {
        id: 'claim-1',
        foundItemId: 'found-2',
        claimerId: 'neighbor-3',
        claimerName: 'Malik',
        message: 'I can collect this after work.',
        status: 'pending',
        createdAt: '2026-04-26T17:35:00.000Z',
      },
    ],
  },
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(cloneValue(value)), 120)
  })
}

function withClaimCount(item: FoundItem): FoundItem {
  const activeClaims = (store.claimsByItemId[item.id] ?? []).filter(
    (claim) => claim.status !== 'cancelled',
  )

  return {
    ...item,
    claimCount: activeClaims.length,
  }
}

function paginate<T>(values: T[], page: number, limit: number): { items: T[]; pagination: PaginationMeta } {
  const total = values.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startIndex = (page - 1) * limit

  return {
    items: values.slice(startIndex, startIndex + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

function sortItems(items: FoundItem[], sortBy: FoundItemsFilter['sortBy']): FoundItem[] {
  if (sortBy === 'nearest') {
    return [...items].sort(
      (left, right) =>
        (left.location.approximateDistance ?? Number.MAX_SAFE_INTEGER) -
        (right.location.approximateDistance ?? Number.MAX_SAFE_INTEGER),
    )
  }

  if (sortBy === 'popular') {
    return [...items].sort((left, right) => right.viewCount - left.viewCount)
  }

  return [...items].sort(
    (left, right) => new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime(),
  )
}

function filterItems(items: FoundItem[], filters: FoundItemsFilter): FoundItem[] {
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) {
      return false
    }

    if (filters.status && item.status !== filters.status) {
      return false
    }

    if (filters.postcode) {
      const normalizedPostcode = filters.postcode.trim().toLowerCase()
      const itemPostcode = item.location.postcode.toLowerCase()
      if (normalizedPostcode.length > 0 && !itemPostcode.includes(normalizedPostcode)) {
        return false
      }
    }

    if (
      filters.maxDistance !== undefined &&
      item.location.approximateDistance !== null &&
      item.location.approximateDistance > filters.maxDistance
    ) {
      return false
    }

    return true
  })
}

function getItemOrThrow(itemId: string): FoundItem {
  const item = store.items.find((currentItem) => currentItem.id === itemId)

  if (!item) {
    throw new Error('Found item not found.')
  }

  return item
}

function viewerActor(actor?: ActorSummary): ActorSummary {
  return actor ?? defaultActor
}

function updateItem(itemId: string, updater: (item: FoundItem) => FoundItem): FoundItem {
  let updatedItem: FoundItem | null = null

  store = {
    ...store,
    items: store.items.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      updatedItem = updater(item)
      return updatedItem
    }),
  }

  if (!updatedItem) {
    throw new Error('Found item not found.')
  }

  return updatedItem
}

export async function fetchFoundItems(
  filters: FoundItemsFilter = {},
  page: number = 1,
  limit: number = 9,
): Promise<FoundItemsResponse> {
  const items = store.items.map(withClaimCount)
  const filteredItems = sortItems(filterItems(items, filters), filters.sortBy ?? 'newest')

  return respond(paginate(filteredItems, page, limit))
}

export async function fetchFoundItemById(
  id: string,
  viewerId?: string,
): Promise<{ item: FoundItem; claims: FoundItemClaim[] }> {
  const item = withClaimCount(getItemOrThrow(id))
  const claims = viewerId && viewerId === item.poster.id ? store.claimsByItemId[id] ?? [] : []

  return respond({ item, claims })
}

export async function fetchMyFoundPosts(
  userId: string = defaultActor.id,
  status?: FoundItemStatus,
  page: number = 1,
  limit: number = 12,
): Promise<FoundItemsResponse> {
  const items = store.items
    .map(withClaimCount)
    .filter((item) => item.poster.id === userId)
    .filter((item) => (status ? item.status === status : true))
    .sort((left, right) => new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime())

  return respond(paginate(items, page, limit))
}

export async function createFoundItem(
  payload: CreateFoundItemPayload,
  poster?: ActorSummary,
): Promise<FoundItem> {
  const resolvedPoster = viewerActor(poster)
  const nextItem: FoundItem = {
    id: `found-${crypto.randomUUID()}`,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    status: 'available',
    images: payload.images.map((image) => ({
      url: image.url,
      thumbnailUrl: image.url,
      altText: image.altText ?? payload.title,
    })),
    location: {
      latitude: payload.location.latitude,
      longitude: payload.location.longitude,
      address: payload.location.address ?? null,
      neighborhood: null,
      postcode: payload.location.postcode,
      approximateDistance: 0,
    },
    condition: payload.condition ?? null,
    poster: resolvedPoster,
    postedAt: new Date().toISOString(),
    expiresAt: null,
    claimCount: 0,
    viewCount: 0,
  }

  store = {
    ...store,
    items: [nextItem, ...store.items],
  }

  return respond(nextItem)
}

export async function updateFoundItemStatus(
  id: string,
  status: FoundItemStatus,
): Promise<FoundItem> {
  const updatedItem = updateItem(id, (item) => ({
    ...item,
    status,
  }))

  return respond(withClaimCount(updatedItem))
}

export async function deleteFoundItem(id: string): Promise<void> {
  store = {
    items: store.items.filter((item) => item.id !== id),
    claimsByItemId: Object.fromEntries(
      Object.entries(store.claimsByItemId).filter(([itemId]) => itemId !== id),
    ),
  }

  await respond(undefined)
}

export async function claimFoundItem(
  id: string,
  actor?: ActorSummary,
  message?: string,
): Promise<FoundItemClaim> {
  const resolvedActor = viewerActor(actor)
  const item = getItemOrThrow(id)
  const currentClaims = store.claimsByItemId[id] ?? []
  const existingClaim = currentClaims.find(
    (claim) => claim.claimerId === resolvedActor.id && claim.status !== 'cancelled',
  )

  if (existingClaim) {
    return respond(existingClaim)
  }

  const nextClaim: FoundItemClaim = {
    id: `claim-${crypto.randomUUID()}`,
    foundItemId: id,
    claimerId: resolvedActor.id,
    claimerName: resolvedActor.name,
    message: message ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  store = {
    ...store,
    claimsByItemId: {
      ...store.claimsByItemId,
      [id]: [nextClaim, ...currentClaims],
    },
  }

  if (item.status === 'available') {
    updateItem(id, (currentItem) => ({
      ...currentItem,
      status: 'claimed',
    }))
  }

  return respond(nextClaim)
}

export async function cancelFoundItemClaim(
  id: string,
  claimerId: string = defaultActor.id,
): Promise<void> {
  const currentClaims = store.claimsByItemId[id] ?? []
  const nextClaims = currentClaims.map((claim) =>
    claim.claimerId === claimerId ? { ...claim, status: 'cancelled' as const } : claim,
  )

  store = {
    ...store,
    claimsByItemId: {
      ...store.claimsByItemId,
      [id]: nextClaims,
    },
  }

  const hasActiveClaim = nextClaims.some((claim) => claim.status !== 'cancelled')
  if (!hasActiveClaim) {
    updateItem(id, (item) => ({
      ...item,
      status: item.status === 'claimed' ? 'available' : item.status,
    }))
  }

  await respond(undefined)
}

export async function reportFoundItem(
  id: string,
  _reason: string,
  _details?: string,
): Promise<void> {
  updateItem(id, (item) => ({
    ...item,
    status: 'reported',
  }))

  await respond(undefined)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read selected image.'))
        return
      }

      resolve(reader.result)
    }
    reader.onerror = () => reject(new Error('Unable to read selected image.'))
    reader.readAsDataURL(file)
  })
}

export async function uploadFoundItemImage(file: File): Promise<{
  url: string
  thumbnailUrl: string
}> {
  const imageUrl = await readFileAsDataUrl(file)

  return respond({
    url: imageUrl,
    thumbnailUrl: imageUrl,
  })
}
