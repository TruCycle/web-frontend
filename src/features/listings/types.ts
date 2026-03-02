import type { PaginationMeta } from '@/shared/types/pagination'

export type ListingStatus = 'Active' | 'Claimed' | 'Completed'

export type ListingsPagination = PaginationMeta

export interface ListingCollector {
  readonly id: string
  readonly name: string
  readonly profileImageUrl: string | null
}

export interface ListingClaim {
  readonly id: string
  readonly status: string
  readonly message: string | null
  readonly createdAt: string | null
  readonly approvedAt: string | null
  readonly completedAt: string | null
  readonly collector: ListingCollector | null
}

export interface DonorListingItem {
  readonly id: string
  readonly title: string
  readonly status: ListingStatus
  readonly category: string
  readonly condition: string
  readonly meta: string
  readonly description: string | null
  readonly imageUrl: string | null
  readonly rawStatus: string
  readonly claimStatus: string | null
  readonly createdAt: string | null
  readonly reward: number | null
  readonly rewardCurrency: string | null
  readonly co2SavedKg: number | null
  readonly claims: readonly ListingClaim[]
}
