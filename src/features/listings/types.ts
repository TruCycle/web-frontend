import type { PaginationMeta } from '@/shared/types/pagination'

export type ListingStatus = 'Active' | 'Claimed' | 'Completed'

export type ListingsPagination = PaginationMeta

export interface DonorListingItem {
  readonly id: string
  readonly title: string
  readonly status: ListingStatus
  readonly category: string
  readonly condition: string
  readonly meta: string
  readonly imageUrl: string | null
  readonly rawStatus: string
  readonly claimStatus: string | null
  readonly co2SavedKg: number | null
}
