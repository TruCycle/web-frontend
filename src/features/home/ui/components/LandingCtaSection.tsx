import { Camera, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

type LandingCtaSectionProps = {
  readonly browseTo: string
  readonly postItemTo: string
  readonly spotTo: string
}

const ticker = 'Just rescued: Washing machine in E3 — 12 kg saved'

export function LandingCtaSection({ browseTo, postItemTo, spotTo }: LandingCtaSectionProps) {
  return (
    <section className="bg-[#F7FBF4] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#0B33221A] bg-tc-shell-accent px-6 py-14 shadow-[0_28px_70px_rgba(11,51,34,0.10)] sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 text-center">
            <div className="space-y-3">
              <h2 className="text-[clamp(2.2rem,5vw,3.1rem)] font-normal leading-[1.02] tracking-[-0.05em] text-[#0B3322]">
                Spot it. Rescue it. Rehome it.
              </h2>
              <p className="mx-auto max-w-[34rem] text-base leading-7 text-[#0B3322]/75 sm:text-[1.05rem] sm:leading-8">
                Every rescued item keeps a neighbour happy and a skip empty.
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#0D3B24]/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D3B24]/8">
                  <Camera size={24} className="text-[#0D3B24]" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-[#0B3322]">Spot something</p>
                  <p className="text-sm leading-6 text-[#0B3322]/65">See an item going to waste? Snap it and put it on the map for a neighbour.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#0D3B24] px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={spotTo}
                >
                  Spot an item
                </Link>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#0D3B24]/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D3B24]/8">
                  <Truck size={24} className="text-[#0D3B24]" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-[#0B3322]">Rescue something</p>
                  <p className="text-sm leading-6 text-[#0B3322]/65">Browse items near you and claim one before it ends up in landfill.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#0D3B24] px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={browseTo}
                >
                  Browse nearby
                </Link>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#0D3B24]/15 bg-white px-6 py-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D3B24]/8">
                  <RefreshCw size={24} className="text-[#0D3B24]" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-semibold text-[#0B3322]">Rehome something</p>
                  <p className="text-sm leading-6 text-[#0B3322]/65">Two minutes. One photo. A neighbour gets what they needed.</p>
                </div>
                <Link
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#0D3B24] px-5 py-2.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                  to={postItemTo}
                >
                  Post an item
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#0D3B24]/15 bg-white/70 px-5 py-2.5 text-sm text-[#0B3322]/70">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#0D3B24]" />
              {ticker}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
