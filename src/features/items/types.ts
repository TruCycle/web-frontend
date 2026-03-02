import type { PaginationMeta } from '@/shared/types/pagination'

export interface ItemImage {
  readonly url: string
  readonly altText: string | null
}

export interface BrowseItem {
  readonly id: string
  readonly title: string
  readonly category: string
  readonly condition: string
  readonly status: string
  readonly pickupOption: string
  readonly distanceKm: number | null
  readonly locationLabel: string
  readonly image: ItemImage | null
  readonly estimatedCo2SavedKg: number | null
  readonly ownerName: string
  readonly claimStatus: string | null
}

export interface ImpactMetrics {
  readonly totalCo2SavedKg: number
  readonly itemsExchanged: number
  readonly itemsDonated: number
  readonly monthlyGoalProgressPercent: number
}

export interface WalletBalance {
  readonly balance: number
  readonly currency: string
}

export interface CollectedItem {
  readonly claimId: string
  readonly claimStatus: string
  readonly claimCreatedAt: string | null
  readonly claimApprovedAt: string | null
  readonly claimCompletedAt: string | null
  readonly reward: number | null
  readonly rewardCurrency: string | null
  readonly item: {
    readonly id: string
    readonly title: string
    readonly category: string
    readonly condition: string
    readonly status: string
    readonly qrCode: string | null
    readonly image: ItemImage | null
    readonly ownerName: string
    readonly locationLabel: string
    readonly dropoffLocationId: string | null
  }
}

export interface QrScanResult {
  readonly accepted: boolean
  readonly duplicate: boolean
  readonly idempotencyKey: string | null
  readonly direction: 'in' | 'out'
}

export interface CollectedItemsResponse {
  readonly items: CollectedItem[]
  readonly pagination: PaginationMeta
}
