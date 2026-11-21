import { Modal } from '@/shared/ui/modal/Modal'
import { Button } from '@/shared/ui/button/Button'

interface ItemQrCodeDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly itemTitle: string
  readonly qrCodeUrl: string | null
}

export function ItemQrCodeDialog({
  isOpen,
  onClose,
  itemTitle,
  qrCodeUrl,
}: ItemQrCodeDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center">
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="pr-12">
          <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">Item QR Code</h2>
          <p className="mt-1 text-sm leading-5 text-tc-brand-body">
            Present this QR code at handoff for <span className="font-semibold text-tc-brand-ink">{itemTitle}</span>.
          </p>
        </div>

        {qrCodeUrl ? (
          <div className="rounded-tc-lg border border-tc-brand-line bg-tc-brand-haze p-6">
            <img
              src={qrCodeUrl}
              alt={`QR code for ${itemTitle}`}
              className="mx-auto aspect-square w-full max-w-[300px] rounded-tc-sm object-contain"
            />
          </div>
        ) : (
          <p className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-6 text-center text-sm text-tc-brand-body">
            QR code is not available for this item yet.
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} className="min-w-[110px]">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
