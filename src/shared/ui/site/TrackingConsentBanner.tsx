import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

type TrackingConsentBannerProps = {
  readonly onAccept: () => void
  readonly onReject: () => void
}

export function TrackingConsentBanner({ onAccept, onReject }: TrackingConsentBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <section aria-label="Cookie preferences" className="pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/70 bg-tc-brand-deep px-4 py-4 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur sm:px-5 sm:py-5 xl:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mb-2 text-lg font-semibold text-white sm:text-2xl">
              Optional cookies
            </h2>
            <p className="m-0 text-sm leading-6 text-tc-brand-haze sm:text-[15px]">
              Allow analytics and campaign tracking? Read our{' '}
              <Link className="font-medium text-tc-brand-mint underline decoration-tc-brand-mint underline-offset-4 transition-colors hover:text-white" to="/cookies">
                cookie policy
              </Link>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:flex-shrink-0">
            <Button
              variant="secondary"
              className="px-3 py-3 text-sm font-semibold"
              onClick={onReject}
            >
              Reject optional
            </Button>
            <Button
              variant="secondary"
              className="px-3 py-3 text-sm font-semibold"
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
