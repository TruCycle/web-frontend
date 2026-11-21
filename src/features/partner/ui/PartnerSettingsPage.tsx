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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Partner Settings</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Manage your partner shops and create new pickup points.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="h-11 w-11 p-0"
            onClick={() => void reload()}
            aria-label="Refresh shops"
            title="Refresh shops"
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            variant="primary"
            className="h-11 px-5 text-sm font-semibold"
            onClick={() => setIsCreatePanelOpen(true)}
          >
            Create New Shop
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">Your shops</h2>

        {isLoading ? (
          <div className="rounded-tc-lg border border-tc-brand-line bg-white p-6 text-sm text-tc-brand-body">
            Loading partner shops...
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-sm text-tc-brand-body">
            No shops yet. Create your first partner shop above.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {shops.map((shop) => (
              <article
                key={shop.id}
                className="rounded-tc-lg border border-tc-brand-line bg-white p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-tc-brand-ink">{shop.name}</h3>
                    <p className="break-all text-xs leading-4 text-tc-brand-muted">{shop.id}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      shop.active
                        ? 'bg-tc-brand-deep text-white'
                        : 'bg-tc-brand-soft text-tc-brand-body'
                    }`}
                  >
                    {shop.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-5 space-y-4 text-sm text-tc-brand-ink">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-tc-brand-muted">Location</p>
                      <p className="mt-1 inline-flex items-start gap-2 text-sm leading-5 text-tc-brand-ink">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-tc-brand-muted" />
                        <span>
                          {shop.addressLine}
                          <br />
                          {shop.postcode}
                        </span>
                      </p>
                    </section>

                    <section className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-tc-brand-muted">Contact</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm leading-5 text-tc-brand-ink">
                        <Phone size={15} className="shrink-0 text-tc-brand-muted" />
                        {shop.phoneNumber ?? 'No phone number set'}
                      </p>
                    </section>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-tc-brand-muted">Opening Hours</p>
                      <p className="mt-1 inline-flex items-center gap-2 text-sm leading-5 text-tc-brand-ink">
                        <Clock3 size={15} className="shrink-0 text-tc-brand-muted" />
                        {formatOpeningHours(shop)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {shop.openingHours?.days?.length ? (
                          shop.openingHours.days.map((day) => (
                            <span
                              key={`${shop.id}-${day}`}
                              className="rounded-tc-sm bg-tc-brand-soft px-2 py-0.5 text-xs font-medium text-tc-brand-body"
                            >
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs leading-4 text-tc-brand-muted">No days configured</span>
                        )}
                      </div>
                    </section>

                    <section className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-tc-brand-muted">Categories</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {shop.acceptableCategories.length > 0 ? (
                          shop.acceptableCategories.map((category) => (
                            <span
                              key={`${shop.id}-${category}`}
                              className="inline-flex items-center gap-1 rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-xs font-semibold text-tc-brand-deep"
                            >
                              <Store size={12} />
                              {formatCategoryLabel(category)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs leading-4 text-tc-brand-muted">No categories configured</span>
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-tc-brand-muted">Operational Notes</p>
                    <p className="mt-1 text-sm leading-5 text-tc-brand-ink">
                      {shop.operationalNotes ?? 'No operational notes provided.'}
                    </p>
                  </section>

                </div>

                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-tc-brand-line pt-4">
                  <Button
                    variant="secondary"
                    className="h-11 px-5 text-sm font-semibold"
                    onClick={() => setEditingShop(shop)}
                  >
                    Edit details
                  </Button>
                  <Button
                    variant={shop.active ? 'danger' : 'primary'}
                    className="h-11 px-5 text-sm font-semibold"
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
