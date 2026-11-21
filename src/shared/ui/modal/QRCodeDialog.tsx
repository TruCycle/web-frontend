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
  const hasScannedPayload = payload.trim().length > 0

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
          <h2 className="pr-12 text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">Scan to collect</h2>
          <p className="mt-1 text-sm leading-5 text-tc-brand-body">
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

          {scannerError ? <p className="text-[13px] leading-5 text-tc-brand-danger">{scannerError}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-tc-brand-line" />
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-tc-brand-muted">
            scanned payload
          </span>
          <div className="h-px flex-1 bg-tc-brand-line" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-tc-brand-ink">QR payload or item id</label>
          <input
            type="text"
            className="h-11 w-full rounded-tc-md border border-tc-brand-control bg-tc-brand-soft px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted disabled:cursor-not-allowed disabled:text-tc-brand-muted"
            placeholder="Waiting for QR scan..."
            value={payload}
            disabled
            readOnly
          />
          <p className="text-[13px] leading-5 text-tc-brand-muted">
            This field is filled automatically from camera scan.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button className="min-w-[110px]" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[110px] !bg-tc-brand-deep !text-white hover:!bg-tc-brand-hover"
            disabled={!hasScannedPayload || isCollecting}
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
