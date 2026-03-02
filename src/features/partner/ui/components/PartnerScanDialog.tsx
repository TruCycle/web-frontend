import { useEffect, useState } from 'react'
import { Link2, QrCode, X } from 'lucide-react'
import { Modal } from '@/shared/ui/modal/Modal'
import { Button } from '@/shared/ui/button/Button'

interface PartnerScanDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly shopName: string
}

interface PartnerScanSummary {
  readonly totalScans: number
  readonly dropOffs: number
  readonly pickups: number
}

interface RecentScan {
  readonly id: string
  readonly action: string
  readonly time: string
}

const DEFAULT_MANUAL_CODE = 'https://trucycle-sustainable-production/item'
const INITIAL_SUMMARY: PartnerScanSummary = {
  totalScans: 1,
  dropOffs: 1,
  pickups: 0,
}
const INITIAL_RECENT_SCANS: readonly RecentScan[] = [
  {
    id: 'item-view',
    action: 'Item View',
    time: '1/19/2026, 4:23 PM',
  },
  {
    id: 'drop-off-id',
    action: 'Drop-Off ID',
    time: '1/19/2026, 4:22 PM',
  },
]

function formatScanTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function PartnerScanDialog({ isOpen, onClose, shopName }: PartnerScanDialogProps) {
  const [manualCode, setManualCode] = useState(DEFAULT_MANUAL_CODE)
  const [summary, setSummary] = useState<PartnerScanSummary>(INITIAL_SUMMARY)
  const [recentScans, setRecentScans] = useState<readonly RecentScan[]>(INITIAL_RECENT_SCANS)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setManualCode(DEFAULT_MANUAL_CODE)
    setSummary(INITIAL_SUMMARY)
    setRecentScans(INITIAL_RECENT_SCANS)
  }, [isOpen])

  const canConfirm = manualCode.trim().length > 0

  const handleConfirmDropOff = () => {
    const normalizedCode = manualCode.trim()
    if (!normalizedCode) {
      return
    }

    const timestamp = formatScanTimestamp(new Date())
    const scan: RecentScan = {
      id: `${Date.now()}`,
      action: 'Drop-Off ID',
      time: timestamp,
    }

    setSummary((current) => ({
      totalScans: current.totalScans + 1,
      dropOffs: current.dropOffs + 1,
      pickups: current.pickups,
    }))
    setRecentScans((current) => [scan, ...current].slice(0, 6))
    setManualCode('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton containerClassName="max-w-[540px]">
      <div className="flex max-h-[88vh] flex-col">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 pb-4 pt-5">
          <h2 className="text-base font-semibold text-slate-900">Scan Item</h2>
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mx-auto flex h-[146px] w-[146px] items-center justify-center rounded-md bg-gradient-to-b from-[#A4F5A6] to-[#34B3B8]">
              <QrCode size={78} className="text-white" strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Point camera at QR code or enter code manually below
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="scan-shop" className="text-[11px] font-medium text-slate-700">
              Shop
            </label>
            <input
              id="scan-shop"
              value={shopName}
              readOnly
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700"
            />
            <p className="text-[10px] text-slate-500">Scans are recorded against the selected shop</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="scan-code" className="text-[11px] font-medium text-slate-700">
              QR Code or Manual Code
            </label>
            <div className="relative">
              <input
                id="scan-code"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-9 text-xs text-slate-700 outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Link2 size={14} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              className="h-10 flex-1 rounded-md text-sm"
              disabled={!canConfirm}
              onClick={handleConfirmDropOff}
            >
              Confirm Drop-off
            </Button>
            <Button
              variant="secondary"
              className="h-10 rounded-md px-4 text-sm"
              onClick={() => setManualCode('')}
            >
              Clear
            </Button>
          </div>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-xs font-semibold text-slate-800">Item Details</h3>
            <div className="mt-2 grid grid-cols-3 gap-3 text-[10px] text-slate-500">
              <div>
                <p>Total Scans</p>
                <p className="mt-1 text-xs font-semibold text-slate-800">{summary.totalScans}</p>
              </div>
              <div>
                <p>Drop-offs</p>
                <p className="mt-1 text-xs font-semibold text-slate-800">{summary.dropOffs}</p>
              </div>
              <div>
                <p>Pickups</p>
                <p className="mt-1 text-xs font-semibold text-slate-800">{summary.pickups}</p>
              </div>
            </div>

            <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-medium text-slate-800">iPhone 12Pro</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                <span>
                  Category: <span className="font-medium text-slate-700">Gadget</span>
                </span>
                <span>
                  Date Listed: <span className="font-medium text-slate-700">Jan 12, 2026 04:42AM</span>
                </span>
                <span>
                  Condition: <span className="font-medium text-slate-700">Like New</span>
                </span>
                <span>
                  Status: <span className="font-medium text-amber-500">Pending dropoff</span>
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-800">Recent Scans</h3>
            <div className="mt-2 space-y-2">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-800">{scan.action}</p>
                    <p className="text-[10px] text-slate-500">{scan.time}</p>
                  </div>
                  <span className="rounded-full border border-lime-500 bg-lime-50 px-2 py-0.5 text-[10px] font-semibold text-lime-700">
                    Done
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}
