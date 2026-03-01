import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../button/Button'
import { CameraQrScanner } from '@/shared/ui/qr'

interface QRCodeDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly item?: unknown
  readonly onCollect: (payload: string) => Promise<void> | void
  readonly isCollecting?: boolean
}

export const QRCodeDialog = ({
  isOpen,
  onClose,
  onCollect,
  isCollecting = false,
}: QRCodeDialogProps) => {
  const [payload, setPayload] = useState('')
  const [scannerError, setScannerError] = useState<string | null>(null)

  const handleClose = () => {
    setPayload('')
    setScannerError(null)
    onClose()
  }

  const handleCollect = async () => {
    const normalizedPayload = payload.trim()
    if (!normalizedPayload || isCollecting) {
      return
    }

    try {
      await onCollect(normalizedPayload)
    } catch {
      setScannerError('Collection could not be completed. Please try again.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="center">
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Scan to collect</h2>
          <p className="mt-1 text-sm text-slate-500">
            Point your camera at the item QR. We&apos;ll register your collection automatically.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <CameraQrScanner
              isActive={isOpen}
              onDetected={(nextPayload) => {
                setPayload(nextPayload)
                setScannerError(null)
              }}
              onError={(errorMessage) => setScannerError(errorMessage)}
            />
          </div>

          {scannerError ? <p className="text-xs text-rose-600">{scannerError}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            or enter manually
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">QR payload or item id</label>
          <input
            type="text"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="Paste QR payload or UUID"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />
          <p className="text-xs leading-5 text-slate-500">
            We&apos;ll attempt one collection per scan to avoid duplicates. You can scan again if needed.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button className="min-w-[110px]" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[110px]"
            disabled={!payload.trim() || isCollecting}
            onClick={() => {
              void handleCollect()
            }}
          >
            {isCollecting ? 'Collecting...' : 'Collect'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
