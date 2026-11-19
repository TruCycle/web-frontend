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
    <section className="bg-tc-brand-haze px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-tc-brand-deep/10 bg-tc-brand-mint px-6 py-14 shadow-[0_28px_70px_rgba(15,42,30,0.10)] sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 text-center">
            <div className="space-y-3">
              <h2 className="text-[clamp(2.2rem,5vw,3.1rem)] font-normal leading-[1.02] tracking-[-0.05em] text-tc-brand-deep">
                Spot it. Rescue it. Rehome it.
              </h2>
              <p className="mx-auto max-w-[34rem] text-base leading-7 text-tc-brand-deep/75 sm:text-[1.05rem] sm:leading-8">
                Help useful things find another home through an agreed handoff.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-tc-brand-deep/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-deep/8">
                  <Camera size={24} className="text-tc-brand-deep" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-tc-brand-deep">Spot something</p>
                  <p className="text-sm leading-6 text-tc-brand-deep/65">Report a useful item you have seen. A spot is not permission to take it.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-tc-brand-deep px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={spotTo}
                >
                  Spot an item
                </Link>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-2xl border border-tc-brand-deep/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-deep/8">
                  <Truck size={24} className="text-tc-brand-deep" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-tc-brand-deep">Rescue something</p>
                  <p className="text-sm leading-6 text-tc-brand-deep/65">Browse current offers and check the details before arranging collection.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-tc-brand-deep px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={browseTo}
                >
                  Browse nearby
                </Link>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-2xl border border-tc-brand-deep/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-deep/8">
                  <RefreshCw size={24} className="text-tc-brand-deep" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-tc-brand-deep">Rehome something</p>
                  <p className="text-sm leading-6 text-tc-brand-deep/65">Add a clear photo, describe the condition, and arrange a handoff.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-tc-brand-deep px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={postItemTo}
                >
                  Post an item
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-tc-brand-deep/15 bg-white/70 px-5 py-2.5 text-sm text-tc-brand-deep/70">
              <span className="h-2 w-2 shrink-0 rounded-full bg-tc-brand-deep" />
              {reminder}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
