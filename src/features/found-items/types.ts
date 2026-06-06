export const foundItemStatuses = [
  'available',
  'claimed',
  'picked_up',
  'expired',
  'reported',
] as const

export type FoundItemStatus = (typeof foundItemStatuses)[number]

export const foundItemCategories = [
  'furniture',
  'electronics',
  'clothing',
  'books',
  'appliances',
  'outdoor',
  'toys',
  'other',
] as const

export type FoundItemCategory = (typeof foundItemCategories)[number]

export interface FoundItemImage {
  readonly url: string
  readonly thumbnailUrl: string
  readonly altText: string | null
}

export interface FoundItemLocation {
  readonly latitude: number
  readonly longitude: number
  readonly address: string | null
  readonly neighborhood: string | null
  readonly postcode: string
  readonly approximateDistance: number | null
}

export interface FoundItem {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: FoundItemCategory
  readonly status: FoundItemStatus
  readonly images: readonly FoundItemImage[]
  readonly location: FoundItemLocation
  readonly condition: string | null
  readonly weightKg: number | null
  readonly estimatedCo2eKg: number
  readonly impactPoints: number
  readonly isFlyTipped: boolean
  readonly poster: {
    readonly id: string
    readonly name: string
    readonly avatarUrl: string | null
  }
  readonly postedAt: string
  readonly expiresAt: string | null
  readonly claimCount: number
  readonly viewCount: number
}

export interface FoundItemClaim {
  readonly id: string
  readonly foundItemId: string
  readonly claimerId: string
  readonly claimerName: string
  readonly message: string | null
  readonly status: 'pending' | 'acknowledged' | 'completed' | 'cancelled'
  readonly createdAt: string
}

export interface FoundItemCarbonCatalogSelection {
  readonly sourceCategory?: string
  readonly subcategory?: string
  readonly item: string
}

export interface FoundItemCatalogEntry {
  readonly sourceCategory: string
  readonly subcategory: string
  readonly item: string
  readonly typicalWeightKg: number
  readonly estimatedCo2eKg: number
  readonly impactPoints: number
}

export interface CreateFoundItemPayload {
  readonly title: string
  readonly description: string
  readonly category: FoundItemCategory
  readonly condition?: string
  readonly weightKg?: number
  readonly isFlyTipped?: boolean
  readonly carbonCatalogSelection?: FoundItemCarbonCatalogSelection
  readonly images: readonly {
    readonly url: string
    readonly altText?: string
  }[]
  readonly location: {
    readonly latitude: number
    readonly longitude: number
    readonly address?: string
    readonly postcode: string
  }
}

export interface FoundItemsFilter {
  readonly category?: FoundItemCategory
  readonly status?: FoundItemStatus
  readonly maxDistance?: number
  readonly postcode?: string
  readonly sortBy?: 'newest' | 'nearest' | 'popular'
}
