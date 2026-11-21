import { Camera, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

type LandingCtaSectionProps = {
  readonly browseTo: string
  readonly postItemTo: string
  readonly spotTo: string
}

const reminder = 'Check ownership and permission before collecting a spotted item.'

export function LandingCtaSection({ browseTo, postItemTo, spotTo }: LandingCtaSectionProps) {
  return (
    <section className="bg-tc-brand-haze px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1184px]">
        <div className="rounded-tc-xl border border-tc-brand-mintLine bg-tc-brand-mintSoft px-5 py-12 sm:px-10 lg:p-16">
          <div className="mx-auto flex flex-col items-center gap-9 text-center">
            <div className="space-y-3">
              <h2 className="text-[clamp(2.1rem,4.6vw,3rem)] font-semibold leading-[1.125] tracking-[-0.03em] text-tc-brand-ink">
                Spot it. Rescue it. Rehome it.
              </h2>
              <p className="mx-auto max-w-[560px] text-base leading-[26px] text-tc-brand-body">
                Help useful things find another home through an agreed handoff.
              </p>
            </div>

            <div className="grid w-full gap-5 sm:grid-cols-3">
              <div className="flex flex-col items-start gap-2.5 rounded-tc-lg border border-tc-brand-line bg-white p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-tc-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft">
                  <Camera size={24} className="text-tc-brand-deep" />
                </div>
                <div className="mb-2 space-y-2 text-left">
                  <p className="text-xl font-semibold leading-7 text-tc-brand-ink">Spot something</p>
                  <p className="text-[15px] leading-6 text-tc-brand-body">Report a useful item you have seen. A spot is not permission to take it.</p>
                </div>
                <Link
                  className="mt-auto inline-flex h-11 items-center justify-center self-start rounded-full px-5 text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 border border-tc-brand-control bg-tc-brand-soft text-tc-brand-ink hover:bg-tc-brand-line"
                  to={spotTo}
                >
                  Spot an item
                </Link>
              </div>

              <div className="flex flex-col items-start gap-2.5 rounded-tc-lg border border-tc-brand-line bg-white p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-tc-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft">
                  <Truck size={24} className="text-tc-brand-deep" />
                </div>
                <div className="mb-2 space-y-2 text-left">
                  <p className="text-xl font-semibold leading-7 text-tc-brand-ink">Rescue something</p>
                  <p className="text-[15px] leading-6 text-tc-brand-body">Browse current offers and check the details before arranging collection.</p>
                </div>
                <Link
                  className="mt-auto inline-flex h-11 items-center justify-center self-start rounded-full px-5 text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 bg-tc-brand-deep text-white hover:bg-tc-brand-hover"
                  to={browseTo}
                >
                  Browse nearby
                </Link>
              </div>

              <div className="flex flex-col items-start gap-2.5 rounded-tc-lg border border-tc-brand-line bg-white p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-tc-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft">
                  <RefreshCw size={24} className="text-tc-brand-deep" />
                </div>
                <div className="mb-2 space-y-2 text-left">
                  <p className="text-xl font-semibold leading-7 text-tc-brand-ink">Rehome something</p>
                  <p className="text-[15px] leading-6 text-tc-brand-body">Add a clear photo, describe the condition, and arrange a handoff.</p>
                </div>
                <Link
                  className="mt-auto inline-flex h-11 items-center justify-center self-start rounded-full px-5 text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 bg-tc-brand-mint text-tc-brand-onMint hover:bg-tc-brand-mintHover"
                  to={postItemTo}
                >
                  Post an item
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 text-left text-[13px] leading-5 text-tc-brand-body">
              <span className="h-2 w-2 shrink-0 rounded-full bg-tc-brand-deep" />
              {reminder}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
