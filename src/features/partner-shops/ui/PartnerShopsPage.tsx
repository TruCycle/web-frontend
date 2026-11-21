import { useState } from 'react'
import { Search } from 'lucide-react'
import { ShopList } from './components/ShopList'
import { ShopDetails } from './components/ShopDetails'
import { ListItemDialog, type ListItemDialogShop } from '@/shared/ui/modal/ListItemDialog'
import { Button } from '@/shared/ui/button/Button'
import { useNearbyShops } from '@/features/partner-shops/hooks/useNearbyShops'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { NewItemButton } from '@/shared/ui/button/NewItemButton'

export default function PartnerShopsPage() {
  const { user } = useAuthSession()
  const {
    filteredShops,
    searchQuery,
    setSearchQuery,
    locationPostcode,
    setLocationPostcode,
    searchByPostcode,
    isLoading,
    error,
    needsLocation,
  } = useNearbyShops(user?.postcode)
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)
  const [preselectedShopForListing, setPreselectedShopForListing] = useState<ListItemDialogShop | null>(null)
  const resolvedSelectedShopId = filteredShops.some((shop) => shop.id === selectedShopId)
    ? selectedShopId
    : filteredShops[0]?.id ?? ''
  const selectedShop =
    filteredShops.find((shop) => shop.id === resolvedSelectedShopId) ??
    filteredShops[0] ??
    null
  const hasMappableCoordinates =
    selectedShop !== null &&
    selectedShop.latitude !== null &&
    selectedShop.longitude !== null

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Partner Shops</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Browse nearby handoff locations connected to TruCycle.</p>
        </div>
        <NewItemButton
          onClick={() => {
            setPreselectedShopForListing(null)
            setIsListItemDialogOpen(true)
          }}
        />
      </div>

      {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}
      <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-sm font-medium text-tc-brand-ink">Search by postcode</span>
            <input
              value={locationPostcode}
              onChange={(event) => setLocationPostcode(event.target.value)}
              className="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint px-3.5"
              placeholder="Enter postcode"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  searchByPostcode(locationPostcode)
                }
              }}
            />
          </label>
          <Button
            className="inline-flex h-11 items-center gap-2 !bg-tc-brand-deep !text-white hover:!bg-tc-brand-hover"
            onClick={() => searchByPostcode(locationPostcode)}
          >
            <Search size={16} />
            Search
          </Button>
        </div>
      </div>

      {needsLocation ? (
        <div className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-sm text-tc-brand-body" role="status">
          Enter a postcode and select Search to find nearby partner shops.
        </div>
      ) : (
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <ShopList
            shops={filteredShops}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedShopId={resolvedSelectedShopId}
            onSelectShop={setSelectedShopId}
          />
          {selectedShop ? (
            <ShopDetails
              shop={selectedShop}
              onPlanHandoff={(shop) => {
                setPreselectedShopForListing({
                  id: shop.id,
                  name: shop.name,
                  postcode: shop.postcode,
                  address: shop.address,
                })
                setIsListItemDialogOpen(true)
              }}
            />
          ) : (
            <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5 text-sm text-tc-brand-body">
              {isLoading ? 'Loading nearby shops...' : 'No partner shops found nearby.'}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-tc-brand-soft">
          {hasMappableCoordinates ? (
            <iframe
              src={`https://www.google.com/maps?q=${selectedShop.latitude},${selectedShop.longitude}&z=14&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              className="min-h-[320px] md:min-h-[620px]"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map view of selected shop location"
            />
          ) : (
            <div className="flex min-h-[620px] items-center justify-center bg-tc-brand-mintSoft p-6 text-center text-sm text-tc-brand-body">
              Map preview unavailable for this shop.
            </div>
          )}
        </div>
      </div>
      )}

      <ListItemDialog
        isOpen={isListItemDialogOpen}
        onClose={() => setIsListItemDialogOpen(false)}
        preselectedShop={preselectedShopForListing}
      />
    </div>
  )
}
