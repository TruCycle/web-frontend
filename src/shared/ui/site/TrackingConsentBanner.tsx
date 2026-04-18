import { Button } from '@/shared/ui/button/Button'
import { Link } from 'react-router-dom'

type TrackingConsentBannerProps = {
  readonly onAccept: () => void
  readonly onReject: () => void
}

export function TrackingConsentBanner({ onAccept, onReject }: TrackingConsentBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <section className="pointer-events-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(18,18,18,0.96)_0%,rgba(34,34,34,0.94)_100%)] px-5 py-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur xl:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mb-2 text-xl font-semibold text-white sm:text-2xl">
              Help us measure what is working.
            </h2>
            <p className="m-0 text-sm leading-6 text-slate-200 sm:text-[15px]">
              We use cookies and similar technologies to understand site traffic, improve campaigns, and keep TruCycle growing responsibly. Read our{' '}
              <Link className="font-medium text-[#A4F5A6] underline decoration-[#A4F5A6]/60 underline-offset-4 transition-colors hover:text-white" to="/cookies">
                cookie policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-shrink-0">
            <Button
              variant="secondary"
              className="min-w-[140px] border-0 bg-white/10 px-5 py-3 text-white ring-white/20 hover:bg-white/15"
              onClick={onReject}
            >
              Not now
            </Button>
            <Button
              variant="highlight"
              className="min-w-[160px] rounded-xl px-5 py-3 text-sm font-semibold outline-offset-0"
              onClick={onAccept}
            >
              Accept cookies
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}