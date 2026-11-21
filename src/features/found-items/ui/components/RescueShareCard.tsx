import { forwardRef } from 'react'

export interface RescueShareCardData {
  readonly title: string
  readonly imageUrl: string | null
  readonly postcode: string
  readonly co2eKg: number
  readonly impactPoints: number
  readonly rescuerName: string
}

interface RescueShareCardProps {
  readonly data: RescueShareCardData
}

/**
 * Static, brand-styled card snapshotted to PNG by `html-to-image` for sharing.
 * Render off-screen with a fixed 1080x1080 viewport for predictable export.
 */
export const RescueShareCard = forwardRef<HTMLDivElement, RescueShareCardProps>(
  function RescueShareCard({ data }, ref) {
    return (
      <div
        ref={ref}
        style={{ width: 1080, height: 1080 }}
        className="relative overflow-hidden rounded-[48px] bg-tc-brand-deep p-16 text-white"
      >
        <div className="absolute right-[-160px] top-[-160px] h-[480px] w-[480px] rounded-full bg-tc-brand-mint/15 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[-180px] h-[520px] w-[520px] rounded-full bg-tc-brand-mint/10 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold tracking-[-0.02em]">TruCycle</span>
            <span className="rounded-full bg-tc-brand-mint px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-tc-brand-onMint">
              Spot
            </span>
          </div>

          <div className="mt-12 flex-1 overflow-hidden rounded-[36px] bg-tc-brand-hover p-8">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt=""
                crossOrigin="anonymous"
                className="h-[480px] w-full rounded-[24px] object-cover"
              />
            ) : (
              <div className="flex h-[480px] w-full items-center justify-center rounded-[24px] bg-tc-brand-deep text-2xl text-tc-brand-onDeep">
                Spotted item
              </div>
            )}

            <h2 className="mt-8 text-[3.2rem] font-semibold leading-[1.05] tracking-[-0.03em]">
              {data.title}
            </h2>
            <p className="mt-3 text-2xl text-tc-brand-onDeep">
              Spotted in {data.postcode} by {data.rescuerName}
            </p>
          </div>

          <p className="mt-10 rounded-[28px] border border-tc-brand-deepLine bg-tc-brand-hover px-6 py-5 text-2xl leading-relaxed">Check availability, condition and owner permission before arranging a handover.</p>

          <p className="mt-8 text-center text-base text-tc-brand-onDeep">
            trucycle.co.uk &middot; keep useful items in use
          </p>
        </div>
      </div>
    )
  },
)
