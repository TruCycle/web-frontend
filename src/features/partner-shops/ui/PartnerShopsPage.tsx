import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ShopList } from './components/ShopList'
import { ShopDetails } from './components/ShopDetails'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { Button } from '@/shared/ui/button/Button'
import { useNearbyShops } from '@/features/partner-shops/hooks/useNearbyShops'
import { useAuthSession } from '@/shared/context/useAuthSession'

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
  } = useNearbyShops(user?.postcode)
  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partner Shops</h1>
          <p className="text-slate-500">Browse nearby handoff locations connected to TruCycle.</p>
        </div>
        <Button
          className="inline-flex items-center gap-2"
          onClick={() => setIsListItemDialogOpen(true)}
        >
          <Plus size={18} />
          List New Item
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">Search by postcode</span>
            <input
              value={locationPostcode}
              onChange={(event) => setLocationPostcode(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
              placeholder="Enter postcode"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  searchByPostcode(locationPostcode)
                }
              }}
            />
          </label>
          <Button
            className="inline-flex h-11 items-center gap-2"
            onClick={() => searchByPostcode(locationPostcode)}
          >
            <Search size={16} />
            Search
          </Button>
        </div>
      </div>

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
            <ShopDetails shop={selectedShop} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              {isLoading ? 'Loading nearby shops...' : 'No partner shops found nearby.'}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {hasMappableCoordinates ? (
            <iframe
              src={`https://www.google.com/maps?q=${selectedShop.latitude},${selectedShop.longitude}&z=14&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '620px' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map view of selected shop location"
            />
          ) : (
            <div className="flex min-h-[620px] items-center justify-center p-6 text-center text-sm text-slate-500">
              Map preview unavailable for this shop.
            </div>
          )}
        </div>
      </div>

      <ListItemDialog
        isOpen={isListItemDialogOpen}
        onClose={() => setIsListItemDialogOpen(false)}
      />
    </div>
  )
}
