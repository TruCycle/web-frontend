import type { PaginationMeta } from '@/shared/types/pagination'

export interface PartnerOpeningHours {
  readonly days: readonly string[]
  readonly openTime: string
  readonly closeTime: string
}

export interface PartnerShop {
  readonly id: string
  readonly name: string
  readonly phoneNumber: string | null
  readonly addressLine: string
  readonly postcode: string
  readonly operationalNotes: string | null
  readonly latitude: number | null
  readonly longitude: number | null
  readonly openingHours: PartnerOpeningHours | null
  readonly acceptableCategories: readonly string[]
  readonly active: boolean
  readonly createdAt: string | null
  readonly updatedAt: string | null
}

export interface PartnerManagedItem {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly pickupOption: string
  readonly category: string
  readonly qrCode: string | null
  readonly imageUrl: string | null
  readonly estimatedCo2SavedKg: number | null
  readonly createdAt: string | null
  readonly claimStatus: string | null
  readonly claimApprovedAt: string | null
  readonly claimCompletedAt: string | null
  readonly collectorName: string | null
  readonly shopId: string | null
  readonly shopName: string | null
}

export interface PartnerQrScanEvent {
  readonly scanType: string
  readonly shopId: string | null
  readonly scannedAt: string | null
}

export interface PartnerQrClaimContext {
  readonly id: string | null
  readonly status: string | null
  readonly collectorId: string | null
}

export interface PartnerQrItemContext {
  readonly id: string
  readonly title: string | null
  readonly category: string | null
  readonly condition: string | null
  readonly status: string
  readonly pickupOption: string
  readonly qrCode: string | null
  readonly createdAt: string | null
  readonly shopId: string | null
  readonly shopName: string | null
  readonly claim: PartnerQrClaimContext | null
  readonly scanEvents: readonly PartnerQrScanEvent[]
}

export interface PartnerQrScanResult {
  readonly accepted: boolean
  readonly duplicate: boolean
  readonly idempotencyKey: string | null
  readonly direction: 'in' | 'out'
  readonly itemId: string | null
}

export interface PartnerQrActionResult {
  readonly scanType: string | null
  readonly scanResult: string | null
  readonly itemStatus: string | null
  readonly claimStatus: string | null
  readonly completedAt: string | null
  readonly scannedAt: string | null
  readonly scanEvents: readonly PartnerQrScanEvent[]
}

export interface PartnerItemsResponse {
  readonly items: readonly PartnerManagedItem[]
  readonly pagination: PaginationMeta
}

export interface FetchPartnerItemsParams {
  readonly status?: string
  readonly pickupOption?: string
  readonly category?: string
  readonly page?: number
  readonly limit?: number
}

export interface CreatePartnerShopPayload {
  readonly name: string
  readonly addressLine: string
  readonly postcode: string
  readonly phoneNumber?: string
  readonly latitude?: number
  readonly longitude?: number
  readonly operationalNotes?: string
  readonly acceptableCategories?: readonly string[]
  readonly openingHours?: PartnerOpeningHours
}

export interface UpdatePartnerShopPayload {
  readonly name?: string
  readonly addressLine?: string
  readonly postcode?: string
  readonly phoneNumber?: string
  readonly latitude?: number
  readonly longitude?: number
  readonly operationalNotes?: string
  readonly acceptableCategories?: readonly string[]
  readonly openingHours?: PartnerOpeningHours
  readonly active?: boolean
}
