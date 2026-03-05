import { useState } from 'react'
import { AlertCircle, Clock3, MapPin, Phone, RefreshCw, Store } from 'lucide-react'
import { ApiError } from '@/shared/types/network'
import { Button } from '@/shared/ui/button/Button'
import { useToast } from '@/shared/ui/toast/useToast'
import { usePartnerShops } from '@/features/partner/hooks/usePartnerShops'
import { PartnerShopForm } from '@/features/partner/ui/components/PartnerShopForm'
import { PartnerShopOffcanvas } from '@/features/partner/ui/components/PartnerShopOffcanvas'
import type { CreatePartnerShopPayload, PartnerShop } from '@/features/partner/types'

function formatOpeningHours(shop: PartnerShop): string {
  if (!shop.openingHours) {
    return 'Opening hours not set'
  }

  return `${shop.openingHours.openTime} - ${shop.openingHours.closeTime}`
}

function formatCategoryLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export default function PartnerSettingsPage() {
  const { success, error: errorToast } = useToast()
  const { shops, isLoading, isSaving, error, createShop, updateShop, toggleShopActive, reload } =
    usePartnerShops()
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<PartnerShop | null>(null)

  async function handleCreateShop(payload: CreatePartnerShopPayload) {
    try {
      await createShop(payload)
      setIsCreatePanelOpen(false)
      success('Shop created', 'Your new partner shop is now active.')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to create shop right now.'
      errorToast('Create failed', message)
      throw caughtError
    }
  }

  async function handleEditShop(payload: CreatePartnerShopPayload) {
    if (!editingShop) {
      return
    }

    try {
      await updateShop(editingShop.id, payload)
      setEditingShop(null)
      success('Shop updated', 'Shop details saved successfully.')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to update shop right now.'
      errorToast('Update failed', message)
      throw caughtError
    }
  }

  async function handleToggleShop(shop: PartnerShop) {
    try {
      await toggleShopActive(shop.id, !shop.active)
      success(
        shop.active ? 'Shop deactivated' : 'Shop activated',
        `${shop.name} is now ${shop.active ? 'inactive' : 'active'}.`,
      )
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to update shop status right now.'
      errorToast('Status update failed', message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partner Settings</h1>
          <p className="text-slate-500">Manage your partner shops and create new pickup points.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="h-11 w-11 rounded-xl p-0"
            onClick={() => void reload()}
            aria-label="Refresh shops"
            title="Refresh shops"
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            variant="highlight"
            className="h-11 rounded-xl px-5 text-sm"
            onClick={() => setIsCreatePanelOpen(true)}
          >
            Create New Shop
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Your shops</h2>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading partner shops...
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            No shops yet. Create your first partner shop above.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {shops.map((shop) => (
              <article
                key={shop.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{shop.name}</h3>
                    <p className="text-xs text-slate-500">{shop.id}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      shop.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {shop.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                      <p className="mt-1 inline-flex items-start gap-2 text-sm text-slate-700">
                        <MapPin size={15} className="mt-0.5 shrink-0" />
                        <span>
                          {shop.addressLine}
                          <br />
                          {shop.postcode}
                        </span>
                      </p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                        <Phone size={15} className="shrink-0" />
                        {shop.phoneNumber ?? 'No phone number set'}
                      </p>
                    </section>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opening Hours</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                        <Clock3 size={15} className="shrink-0" />
                        {formatOpeningHours(shop)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {shop.openingHours?.days?.length ? (
                          shop.openingHours.days.map((day) => (
                            <span
                              key={`${shop.id}-${day}`}
                              className="rounded-md border border-lime-200 bg-lime-50 px-2 py-0.5 text-xs font-medium text-lime-800"
                            >
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">No days configured</span>
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {shop.acceptableCategories.length > 0 ? (
                          shop.acceptableCategories.map((category) => (
                            <span
                              key={`${shop.id}-${category}`}
                              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"
                            >
                              <Store size={12} />
                              {formatCategoryLabel(category)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">No categories configured</span>
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational Notes</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      {shop.operationalNotes ?? 'No operational notes provided.'}
                    </p>
                  </section>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-10 rounded-xl px-4 text-sm"
                    onClick={() => setEditingShop(shop)}
                  >
                    Edit details
                  </Button>
                  <Button
                    variant={shop.active ? 'danger' : 'primary'}
                    className="h-10 rounded-xl px-4 text-sm"
                    disabled={isSaving}
                    onClick={() => void handleToggleShop(shop)}
                  >
                    {shop.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <PartnerShopOffcanvas
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        title="Create New Shop"
        subtitle="Add a new partner-managed shop with opening hours and acceptable categories."
      >
        <PartnerShopForm
          key="create-shop-form"
          submitLabel={isSaving ? 'Saving...' : 'Create shop'}
          isSubmitting={isSaving}
          onSubmit={handleCreateShop}
          onCancel={() => setIsCreatePanelOpen(false)}
        />
      </PartnerShopOffcanvas>

      <PartnerShopOffcanvas
        isOpen={editingShop !== null}
        onClose={() => setEditingShop(null)}
        title="Edit Shop"
        subtitle="Update shop profile, opening hours, and acceptable categories."
      >
        {editingShop ? (
          <PartnerShopForm
            key={editingShop.id}
            initialShop={editingShop}
            submitLabel={isSaving ? 'Saving...' : 'Save changes'}
            isSubmitting={isSaving}
            onSubmit={handleEditShop}
            onCancel={() => setEditingShop(null)}
          />
        ) : null}
      </PartnerShopOffcanvas>
    </div>
  )
}
