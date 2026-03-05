import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link2, Loader2, QrCode, RefreshCw, X } from 'lucide-react'
import {
  completePartnerPickup,
  confirmPartnerDropoff,
  fetchPartnerQrItemContext,
  scanPartnerQrCode,
} from '@/features/partner/api/partnerApi'
import type { PartnerQrItemContext, PartnerShop } from '@/features/partner/types'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { CameraQrScanner } from '@/shared/ui/qr'
import { CustomSelect } from '@/shared/ui/select'
import { useToast } from '@/shared/ui/toast/useToast'

interface PartnerScanDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly shops: readonly PartnerShop[]
}

const uuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatScanTimestamp(value: string | null): string {
  if (!value) {
    return '-'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function extractItemIdFromPayload(payload: string): string | null {
  const normalizedPayload = payload.trim()
  if (!normalizedPayload) {
    return null
  }

  const directMatch = normalizedPayload.match(uuidPattern)
  if (directMatch) {
    return directMatch[0]
  }

  if (normalizedPayload.includes(':')) {
    const tokenized = normalizedPayload.split(':')
    const tail = tokenized[tokenized.length - 1]?.trim() ?? ''
    const tailMatch = tail.match(uuidPattern)
    if (tailMatch) {
      return tailMatch[0]
    }

    const lastToken = tokenized[tokenized.length - 1]?.trim()
    const secondLastToken = tokenized[tokenized.length - 2]?.trim().toLowerCase()
    if (
      secondLastToken === 'item' &&
      lastToken &&
      !lastToken.includes('/') &&
      !lastToken.includes(' ')
    ) {
      return lastToken
    }
  }

  try {
    const url = new URL(normalizedPayload)
    const pathSegments = url.pathname.split('/').filter((segment) => segment.length > 0)
    const segmentWithUuid = pathSegments.find((segment) => uuidPattern.test(segment))
    if (segmentWithUuid) {
      const matched = segmentWithUuid.match(uuidPattern)
      if (matched) {
        return matched[0]
      }
    }

    const itemMarkerIndex = pathSegments.findIndex((segment) => {
      const lowerCaseSegment = segment.toLowerCase()
      return lowerCaseSegment === 'item' || lowerCaseSegment === 'items'
    })
    if (itemMarkerIndex >= 0 && pathSegments[itemMarkerIndex + 1]) {
      return pathSegments[itemMarkerIndex + 1] ?? null
    }
  } catch {
    // Continue to fallback handling.
  }

  if (!normalizedPayload.includes('://') && !normalizedPayload.includes(' ')) {
    return normalizedPayload
  }

  return null
}

type PendingScanAction = 'dropoff' | 'pickup' | null

function resolvePendingAction(itemContext: PartnerQrItemContext | null): PendingScanAction {
  if (!itemContext) {
    return null
  }

  const normalizedStatus = itemContext.status.toLowerCase()
  const normalizedClaimStatus = itemContext.claim?.status?.toLowerCase() ?? ''

  if (normalizedStatus.includes('pending_dropoff')) {
    return 'dropoff'
  }

  if (
    normalizedStatus.includes('awaiting_collection') ||
    normalizedClaimStatus === 'approved'
  ) {
    return 'pickup'
  }

  return null
}

function getStatusClassName(status: string): string {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('pending_dropoff')) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (normalizedStatus.includes('awaiting_collection') || normalizedStatus.includes('approved')) {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  if (normalizedStatus.includes('complete') || normalizedStatus.includes('collected')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (normalizedStatus.includes('recycled') || normalizedStatus.includes('recycle')) {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export function PartnerScanDialog({ isOpen, onClose, shops }: PartnerScanDialogProps) {
  const { success, error: errorToast, info } = useToast()

  const [selectedShopId, setSelectedShopId] = useState('')
  const [scannerSession, setScannerSession] = useState(0)
  const [manualCode, setManualCode] = useState('')
  const [lastScannedPayload, setLastScannedPayload] = useState('')
  const [itemContext, setItemContext] = useState<PartnerQrItemContext | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isResolvingScan, setIsResolvingScan] = useState(false)
  const [isExecutingAction, setIsExecutingAction] = useState(false)

  const activeShops = useMemo(
    () => shops.filter((shop) => shop.active),
    [shops],
  )
  const shopOptions = useMemo(
    () =>
      activeShops.map((shop) => ({
        value: shop.id,
        label: `${shop.name} (${shop.postcode})`,
      })),
    [activeShops],
  )
  const selectedShop = useMemo(
    () => activeShops.find((shop) => shop.id === selectedShopId) ?? null,
    [activeShops, selectedShopId],
  )
  const sortedScanEvents = useMemo(() => {
    if (!itemContext) {
      return []
    }

    return [...itemContext.scanEvents].sort((left, right) => {
      const leftTime = left.scannedAt ? Date.parse(left.scannedAt) : 0
      const rightTime = right.scannedAt ? Date.parse(right.scannedAt) : 0
      return rightTime - leftTime
    })
  }, [itemContext])

  const pendingAction = useMemo(() => resolvePendingAction(itemContext), [itemContext])
  const hasActiveShops = activeShops.length > 0
  const canTriggerAction = Boolean(itemContext && selectedShopId && !isResolvingScan)

  useEffect(() => {
    if (activeShops.length === 0) {
      setSelectedShopId('')
      return
    }

    setSelectedShopId((currentShopId) =>
      activeShops.some((shop) => shop.id === currentShopId)
        ? currentShopId
        : activeShops[0]?.id ?? '',
    )
  }, [activeShops])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setScannerSession((current) => current + 1)
    setManualCode('')
    setLastScannedPayload('')
    setItemContext(null)
    setScanError(null)
    setScannerError(null)
    setActionError(null)
  }, [isOpen])

  const resolveQrPayload = useCallback(async (payload: string) => {
    const normalizedPayload = payload.trim()
    if (!normalizedPayload) {
      return
    }

    if (!selectedShopId) {
      setScanError('Select an active shop before scanning.')
      return
    }

    setScanError(null)
    setActionError(null)
    setScannerError(null)
    setManualCode(normalizedPayload)
    setLastScannedPayload(normalizedPayload)
    setIsResolvingScan(true)

    try {
      const scanResult = await scanPartnerQrCode({
        qrPayload: normalizedPayload,
        direction: 'in',
        shopId: selectedShopId,
      })
      const resolvedItemId = scanResult.itemId ?? extractItemIdFromPayload(normalizedPayload)
      if (!resolvedItemId) {
        throw new Error('Scanned QR does not contain a valid item identifier.')
      }

      const nextItemContext = await fetchPartnerQrItemContext(resolvedItemId)
      setItemContext(nextItemContext)

      if (scanResult.duplicate) {
        info('Duplicate scan', 'This QR was recently scanned for the selected shop.')
      }
    } catch (error) {
      const message = readErrorMessage(error, 'Unable to process this QR code right now.')
      setScanError(message)
      setItemContext(null)
      errorToast('Scan failed', message)
    } finally {
      setIsResolvingScan(false)
    }
  }, [errorToast, info, selectedShopId])

  const refreshScannedItem = useCallback(async () => {
    if (!itemContext) {
      return
    }

    setIsResolvingScan(true)
    setActionError(null)
    try {
      const refreshed = await fetchPartnerQrItemContext(itemContext.id)
      setItemContext(refreshed)
    } catch (error) {
      const message = readErrorMessage(error, 'Unable to refresh item details.')
      setActionError(message)
    } finally {
      setIsResolvingScan(false)
    }
  }, [itemContext])

  const handleDropoff = useCallback(async () => {
    if (!itemContext || !selectedShopId || isExecutingAction) {
      return
    }

    setActionError(null)
    setIsExecutingAction(true)
    try {
      await confirmPartnerDropoff(itemContext.id, selectedShopId)
      success('Drop-off confirmed', 'Item drop-off has been registered successfully.')
      await refreshScannedItem()
    } catch (error) {
      const message = readErrorMessage(error, 'Unable to confirm drop-off right now.')
      setActionError(message)
      errorToast('Drop-off failed', message)
    } finally {
      setIsExecutingAction(false)
    }
  }, [errorToast, isExecutingAction, itemContext, refreshScannedItem, selectedShopId, success])

  const handlePickup = useCallback(async () => {
    if (!itemContext || !selectedShopId || isExecutingAction) {
      return
    }

    setActionError(null)
    setIsExecutingAction(true)
    try {
      await completePartnerPickup(itemContext.id, selectedShopId)
      success('Pick-up confirmed', 'Item pick-up has been registered successfully.')
      await refreshScannedItem()
    } catch (error) {
      const message = readErrorMessage(error, 'Unable to confirm pick-up right now.')
      setActionError(message)
      errorToast('Pick-up failed', message)
    } finally {
      setIsExecutingAction(false)
    }
  }, [errorToast, isExecutingAction, itemContext, refreshScannedItem, selectedShopId, success])

  const handleScanAnother = useCallback(() => {
    setItemContext(null)
    setManualCode('')
    setLastScannedPayload('')
    setScanError(null)
    setScannerError(null)
    setActionError(null)
    setScannerSession((current) => current + 1)
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton containerClassName="max-w-[620px]">
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 pb-4 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Scan Item</h2>
            <p className="mt-1 text-xs text-slate-500">
              Scan once to load item details, then confirm drop-off or pick-up.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-label="Close scan dialog"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1">
            <label htmlFor="scan-shop" className="text-[11px] font-medium text-slate-700">
              Shop
            </label>
            <CustomSelect
              id="scan-shop"
              value={selectedShopId}
              options={shopOptions}
              onChange={setSelectedShopId}
              disabled={!hasActiveShops || isResolvingScan || isExecutingAction}
              placeholder={hasActiveShops ? 'Select a shop' : 'No active shop'}
              buttonClassName="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"
            />
            <p className="text-[10px] text-slate-500">
              {hasActiveShops
                ? 'Scans and actions are recorded against the selected active shop.'
                : 'No active partner shop available. Activate or create one in settings.'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-center">
              <CameraQrScanner
                key={scannerSession}
                isActive={isOpen && hasActiveShops && !isResolvingScan && !isExecutingAction}
                onDetected={(payload) => {
                  void resolveQrPayload(payload)
                }}
                onError={(message) => setScannerError(message)}
                className="h-[160px] w-[160px] rounded-xl"
              />
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Point camera at QR code. Payload is submitted automatically on detection.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="scan-code" className="text-[11px] font-medium text-slate-700">
              QR Code or Manual Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="scan-code"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100"
                  placeholder="Paste QR payload or item link"
                  disabled={!hasActiveShops || isResolvingScan || isExecutingAction}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Link2 size={14} />
                </span>
              </div>
              <Button
                variant="secondary"
                className="h-10 rounded-md px-4 text-sm"
                disabled={
                  !hasActiveShops ||
                  manualCode.trim().length === 0 ||
                  isResolvingScan ||
                  isExecutingAction
                }
                onClick={() => {
                  void resolveQrPayload(manualCode)
                }}
              >
                {isResolvingScan ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <QrCode size={16} />
                )}
              </Button>
            </div>
          </div>

          {scannerError ? (
            <p className="text-xs text-amber-600">{scannerError}</p>
          ) : null}
          {scanError ? <p className="text-xs text-rose-600">{scanError}</p> : null}
          {actionError ? <p className="text-xs text-rose-600">{actionError}</p> : null}

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-xs font-semibold text-slate-800">Item Details</h3>
            {!itemContext ? (
              <p className="mt-2 text-xs text-slate-500">
                Scan an item QR to view details and next action.
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {itemContext.title ?? `Item ${itemContext.id}`}
                      </p>
                      <p className="text-[10px] text-slate-500">{itemContext.id}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClassName(itemContext.status)}`}
                    >
                      {toTitleCase(itemContext.status)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
                    <p>
                      Pickup: <span className="font-medium text-slate-700">{toTitleCase(itemContext.pickupOption)}</span>
                    </p>
                    <p>
                      Claim: <span className="font-medium text-slate-700">{itemContext.claim?.status ? toTitleCase(itemContext.claim.status) : '-'}</span>
                    </p>
                    <p>
                      Category: <span className="font-medium text-slate-700">{itemContext.category ?? '-'}</span>
                    </p>
                    <p>
                      Condition: <span className="font-medium text-slate-700">{itemContext.condition ?? '-'}</span>
                    </p>
                    <p className="col-span-2">
                      Created:{' '}
                      <span className="font-medium text-slate-700">
                        {formatScanTimestamp(itemContext.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Button
                    variant="primary"
                    className="h-10 rounded-md text-sm"
                    disabled={
                      pendingAction !== 'dropoff' || !canTriggerAction || isExecutingAction
                    }
                    onClick={() => {
                      void handleDropoff()
                    }}
                  >
                    {isExecutingAction && pendingAction === 'dropoff' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : null}
                    Confirm Drop-off
                  </Button>
                  <Button
                    variant="primary"
                    className="h-10 rounded-md text-sm"
                    disabled={pendingAction !== 'pickup' || !canTriggerAction || isExecutingAction}
                    onClick={() => {
                      void handlePickup()
                    }}
                  >
                    {isExecutingAction && pendingAction === 'pickup' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : null}
                    Confirm Pick-up
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-10 rounded-md px-4 text-sm"
                    onClick={handleScanAnother}
                    disabled={isResolvingScan || isExecutingAction}
                  >
                    <RefreshCw size={16} />
                    Scan Another
                  </Button>
                </div>

                {pendingAction === null ? (
                  <p className="text-[11px] text-slate-500">
                    No pending drop-off or pick-up action for the current item status.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-800">Recent Scan Events</h3>
            <div className="mt-2 space-y-2">
              {itemContext && sortedScanEvents.length > 0 ? (
                sortedScanEvents.slice(0, 6).map((scanEvent, index) => (
                  <div
                    key={`${scanEvent.scanType}-${scanEvent.scannedAt ?? index}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        {toTitleCase(scanEvent.scanType)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formatScanTimestamp(scanEvent.scannedAt)}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                      {scanEvent.shopId ?? selectedShop?.name ?? '-'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                  {lastScannedPayload
                    ? 'No scan events returned for this item yet.'
                    : 'Scan events appear here after QR is resolved.'}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}
