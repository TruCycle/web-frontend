import { useLayoutEffect, useRef } from 'react'
import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

type TrackingConsentBannerProps = {
  readonly onAccept: () => void
  readonly onReject: () => void
}

export function TrackingConsentBanner({ onAccept, onReject }: TrackingConsentBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  // Publish the banner height so bottom-anchored toasts can stack above it.
  useLayoutEffect(() => {
    const banner = bannerRef.current
    if (!banner) return
    const root = document.documentElement
    const update = () => root.style.setProperty('--tc-consent-offset', `${banner.offsetHeight}px`)
    update()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(banner)
    return () => {
      observer?.disconnect()
      root.style.removeProperty('--tc-consent-offset')
    }
  }, [])
  return (
    <div ref={bannerRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <section aria-label="Cookie preferences" className="pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(18,18,18,0.96)_0%,rgba(34,34,34,0.94)_100%)] px-4 py-4 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur sm:px-5 sm:py-5 xl:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mb-2 text-lg font-semibold text-white sm:text-2xl">
              Optional cookies
            </h2>
            <p className="m-0 text-sm leading-6 text-slate-200 sm:text-[15px]">
              Allow analytics and campaign tracking? Read our{' '}
              <Link className="font-medium text-[#A4F5A6] underline decoration-[#A4F5A6]/60 underline-offset-4 transition-colors hover:text-white" to="/cookies">
                cookie policy
              </Link>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:flex-shrink-0">
            <Button
              variant="secondary"
              className="border-0 bg-white/10 px-3 py-3 text-sm text-white ring-white/20 hover:bg-white/15"
              onClick={onReject}
            >
              Reject optional
            </Button>
            <Button
              variant="highlight"
              className="rounded-xl px-3 py-3 text-sm font-semibold outline-offset-0"
              onClick={onAccept}
            >
              Accept optional
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
