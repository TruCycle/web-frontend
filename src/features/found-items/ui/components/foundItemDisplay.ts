import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import type { FoundItem } from '../../types'

export function formatFoundItemLocationSummary(item: Pick<FoundItem, 'location'>): string {
  const address = item.location.address?.trim() ?? ''
  const neighborhood = item.location.neighborhood?.trim() ?? ''
  const postcode = item.location.postcode.trim()

  if (address && neighborhood) {
    return `${address}, near ${neighborhood} · ${postcode}`
  }

  if (address) {
    return postcode ? `${address} · ${postcode}` : address
  }

  if (neighborhood) {
    return postcode ? `${neighborhood} · ${postcode}` : neighborhood
  }

  return postcode || 'Location pending'
}

export function formatFoundItemAttribution(item: Pick<FoundItem, 'poster' | 'postedAt'>): string {
  return `Spotted by ${item.poster.name} · ${formatRelativeTime(item.postedAt)}`
}