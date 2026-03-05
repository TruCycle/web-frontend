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
        <div className="pr-9">
          <h2 className="text-xl font-bold text-slate-900">Item QR Code</h2>
          <p className="mt-1 text-sm text-slate-500">
            Present this QR code at handoff for <span className="font-medium">{itemTitle}</span>.
          </p>
        </div>

        {qrCodeUrl ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <img
              src={qrCodeUrl}
              alt={`QR code for ${itemTitle}`}
              className="mx-auto aspect-square w-full max-w-[300px] rounded-lg object-contain"
            />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
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
