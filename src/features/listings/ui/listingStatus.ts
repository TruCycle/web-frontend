import type { DonorListingItem } from '@/features/listings/types'

export function donorListingStatusLabel(
  item: Pick<DonorListingItem, 'status' | 'claimStatus'>,
): string {
  const claimStatus = item.claimStatus?.trim().toLowerCase()
  if (
    item.status !== 'Completed' &&
    (claimStatus === 'pending' || claimStatus === 'pending_approval')
  ) {
    return 'Awaiting approval'
  }

  return item.status
}
