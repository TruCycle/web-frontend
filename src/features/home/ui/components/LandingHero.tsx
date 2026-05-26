import { Link } from 'react-router-dom'

import bagShoeImg from '@/assets/images/bag-shoe.jpg'
import bookPlannerImg from '@/assets/images/book-planner.jpg'
import scentedCandleImg from '@/assets/images/scented-candle.jpg'

type LandingHeroProps = {
  readonly browseTo: string
  readonly postItemTo: string
}

const metrics = [
  { value: '12,400+', label: 'Items rehomed' },
  { value: '2,180', label: 'Active givers' },
  { value: '38 tons', label: 'Diverted from landfill' },
] as const

export function LandingHero({ browseTo, postItemTo }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-32 sm:pb-24 sm:pt-36 lg:pt-40">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_18%_22%,rgba(164,245,166,0.25),transparent_42%),radial-gradient(circle_at_78%_18%,rgba(11,51,34,0.08),transparent_32%)]" />
      <div className="absolute left-1/2 top-24 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-tc-shell-accent/20 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[440px_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="max-w-[27.5rem]">
          <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
            Free - London &amp; surrounding areas
          </p>

          <h1 className="mt-6 text-[clamp(3.35rem,8vw,5.5rem)] font-normal leading-[0.92] tracking-[-0.06em] text-[#0B3322]">
            <span className="block">Your clutter is</span>
            <span className="block">someone&apos;s</span>
            <span className="block text-[#172033]">treasure.</span>
          </h1>

          <div className="mt-8 space-y-1.5 text-base leading-8 text-[#121212B3] sm:text-[1.02rem]">
            <p>List the things you no longer need. Neighbours collect them, free.</p>
            <p>No skips, no landfill, no faff - just stuff finding new homes.</p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-[#0B3322] px-6 py-3 text-base font-bold text-white no-underline shadow-[0_18px_40px_rgba(11,51,34,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
              to={postItemTo}
            >
              Post an item -&gt;
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-[#0B33221A] bg-[#F8FCF7] px-6 py-3 text-base font-bold text-[#0B3322] no-underline transition-colors duration-200 hover:bg-white"
              to={browseTo}
            >
              Browse free items
            </Link>
          </div>

          <div className="mt-10 h-px w-full max-w-[25.625rem] bg-[#CBD5E1]" />

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div className="max-w-[7rem]" key={metric.label}>
                <p className="text-[1.7rem] font-normal leading-none tracking-[-0.05em] text-[#0B3322]">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm font-medium tracking-[0.02em] text-[#121212B3]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[29rem] w-full max-w-[28rem] lg:h-[31rem] lg:max-w-[29rem]">
          <div className="absolute left-0 top-0 h-[70%] w-[58%] overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_24px_70px_rgba(11,51,34,0.12)]">
            <img alt="Bag and shoes ready for reuse" className="h-full w-full object-cover" src={bagShoeImg} />
          </div>

          <div className="absolute right-0 top-10 h-[42%] w-[46%] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_20px_60px_rgba(11,51,34,0.10)]">
            <img alt="Books and planner stacked together" className="h-full w-full object-cover" loading="lazy" src={bookPlannerImg} />
          </div>

          <div className="absolute bottom-0 left-[18%] h-[38%] w-[50%] overflow-hidden rounded-[1.65rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(11,51,34,0.10)]">
            <img alt="Reusable home item detail" className="h-full w-full object-cover" loading="lazy" src={scentedCandleImg} />
          </div>

          <div className="absolute -left-5 top-14 h-24 w-24 rounded-full bg-tc-shell-accent/30 blur-2xl" />
          <div className="absolute right-4 top-0 h-16 w-16 rounded-full border border-tc-shell-accent/35 bg-[radial-gradient(circle_at_35%_35%,rgba(164,245,166,0.95),rgba(255,156,45,0.42)_58%,rgba(248,250,252,0.16)_100%)] shadow-[0_16px_40px_rgba(164,245,166,0.18)]" />
          <div className="absolute bottom-10 right-6 h-24 w-24 rounded-full border border-[#FF9C2D33] bg-[radial-gradient(circle_at_35%_35%,rgba(255,156,45,0.78),rgba(164,245,166,0.34)_55%,rgba(248,250,252,0.10)_100%)] shadow-[0_18px_50px_rgba(255,156,45,0.18)] backdrop-blur-sm" />
        </div>
      </div>
    </section>
  )
}