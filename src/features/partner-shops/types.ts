export interface Shop {
  readonly id: string
  readonly name: string
  readonly postcode: string
  readonly address: string
  readonly distance: string
  readonly openingHours: string
  readonly acceptedItems: readonly string[]
  readonly amenities: readonly string[]
  readonly latitude: number | null
  readonly longitude: number | null
}
