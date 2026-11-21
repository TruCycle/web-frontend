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
        className="fixed inset-0 z-[180] bg-tc-brand-ink/55"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-2 top-[72px] z-[181] h-[calc(100dvh-88px)] w-[calc(100vw-1rem)] max-w-[720px] sm:right-10 sm:h-[90vh] sm:w-full sm:max-w-[min(720px,calc(100vw-5rem))] rounded-tc-xl bg-white p-4 shadow-tc-dialog sm:p-6">
        <div className="flex h-full flex-col gap-5">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">{title}</h2>
              <p className="mt-1 max-w-[58ch] text-sm leading-5 text-tc-brand-body">{subtitle}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-soft text-tc-brand-ink transition hover:bg-tc-brand-line"
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
