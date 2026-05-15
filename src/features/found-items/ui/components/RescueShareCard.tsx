import { forwardRef } from 'react'
import { Leaf, Award } from 'lucide-react'

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
        className="relative overflow-hidden rounded-[48px] bg-[linear-gradient(160deg,#0F1F08_0%,#1F3A12_55%,#345B1B_100%)] p-16 text-white"
      >
        <div className="absolute right-[-160px] top-[-160px] h-[480px] w-[480px] rounded-full bg-[#A4F5A6]/20 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[-180px] h-[520px] w-[520px] rounded-full bg-[#34DA45]/20 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold tracking-[-0.02em]">TruCycle</span>
            <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em]">
              Rescue
            </span>
          </div>

          <div className="mt-12 flex-1 overflow-hidden rounded-[36px] bg-white/10 p-8 backdrop-blur">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt=""
                crossOrigin="anonymous"
                className="h-[480px] w-full rounded-[24px] object-cover"
              />
            ) : (
              <div className="flex h-[480px] w-full items-center justify-center rounded-[24px] bg-[#1F3A12] text-2xl text-white/60">
                Rescued item
              </div>
            )}

            <h2 className="mt-8 text-[3.2rem] font-bold leading-[1.05] tracking-[-0.03em]">
              {data.title}
            </h2>
            <p className="mt-3 text-2xl text-white/70">
              Saved in {data.postcode} by {data.rescuerName}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-5">
            <div className="flex items-center gap-4 rounded-[28px] bg-white/12 px-6 py-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#A4F5A6]/30">
                <Leaf size={32} className="text-[#A4F5A6]" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">CO2e saved</p>
                <p className="text-4xl font-bold tracking-[-0.03em]">{data.co2eKg.toFixed(1)} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-[28px] bg-white/12 px-6 py-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE7A1]/30">
                <Award size={32} className="text-[#FFE7A1]" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">Impact</p>
                <p className="text-4xl font-bold tracking-[-0.03em]">{data.impactPoints} pts</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-base text-white/55">
            trucycle.app &middot; give more, waste less
          </p>
        </div>
      </div>
    )
  },
)
