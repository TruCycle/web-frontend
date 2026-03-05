import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface PartnerShopOffcanvasProps {
  readonly isOpen: boolean
  readonly title: string
  readonly subtitle: string
  readonly onClose: () => void
  readonly children: ReactNode
}

export function PartnerShopOffcanvas({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: PartnerShopOffcanvasProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[180] bg-[#E2E8F080]"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-10 top-[72px] z-[181] h-[90vh] w-full max-w-[720px] rounded-lg bg-white p-6 shadow-[0px_4px_20px_0px_#E2E8F080]">
        <div className="flex h-full flex-col gap-5">
          <header className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#121212]">{title}</h2>
              <p className="max-w-[58ch] text-md text-[#12121299]">{subtitle}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#222222BF] hover:bg-slate-200"
              onClick={onClose}
              aria-label="Close partner shop panel"
            >
              <X size={20} />
            </button>
          </header>

          <hr />

          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </div>
      </aside>
    </>,
    document.body,
  )
}
