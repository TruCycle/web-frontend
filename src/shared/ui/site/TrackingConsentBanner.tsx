import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

type TrackingConsentBannerProps = {
  readonly onAccept: () => void
  readonly onReject: () => void
}

export function TrackingConsentBanner({ onAccept, onReject }: TrackingConsentBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <section aria-label="Cookie preferences" className="pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-tc-xl border border-tc-brand-deepLine bg-tc-brand-deep px-5 py-5 text-white shadow-tc-dialog sm:px-6 sm:py-5 xl:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
          <div className="max-w-2xl">
            <h2 className="mb-1.5 text-lg leading-6 font-semibold text-white">
              Optional cookies
            </h2>
            <p className="m-0 text-sm leading-5 text-tc-brand-onDeep">
              Allow analytics and campaign tracking? Read our{' '}
              <Link className="font-semibold text-tc-brand-mint underline decoration-tc-brand-mint underline-offset-4 transition-colors hover:text-white" to="/cookies">
                cookie policy
              </Link>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:flex-shrink-0">
            <Button
              variant="secondary"
              className="whitespace-nowrap px-4 py-3 text-sm font-semibold"
              onClick={onReject}
            >
              Reject optional
            </Button>
            <Button
              variant="secondary"
              className="whitespace-nowrap px-4 py-3 text-sm font-semibold"
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
