import { Link } from 'react-router-dom'

type LandingImpactSectionProps = {
  readonly browseTo: string
}

const smallMetrics = [
  {
    description: 'Describe the condition so someone can decide whether it suits them.',
    value: 'Be clear',
  },
  {
    description: 'Agree collection details directly before travelling.',
    value: 'Plan ahead',
  },
] as const

export function LandingImpactSection({ browseTo }: LandingImpactSectionProps) {
  return (
    <section className="bg-[#0B3322] px-6 py-20 text-white sm:py-24" id="impact">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[405px_minmax(0,1fr)] lg:items-center lg:gap-[3.125rem]">
        <div className="space-y-[1.125rem]">
          <p className="text-sm font-bold tracking-[0.04em] text-tc-shell-accent">
            Why it matters
          </p>

          <div className="space-y-2 text-[clamp(2.55rem,5vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.05em]">
            <p>Give useful things</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>a chance</span>
              <span className="text-tc-shell-accent">at another</span>
            </div>
            <p className="text-tc-shell-accent">home.</p>
          </div>

          <p className="max-w-[25rem] text-[1.05rem] leading-8 text-[#C9D8CF]">
            Reuse starts with an item someone can use and a handoff both people
            agree to. Offer it clearly, check its condition, and arrange a
            practical collection together.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-bold text-white no-underline transition-colors hover:bg-white/5"
              href="#how"
            >
              See how reuse works -&gt;
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.1rem] bg-tc-shell-accent p-6 text-[#0B3322] shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="flex items-start gap-2">
              <span className="text-[clamp(3.3rem,8vw,4.8rem)] font-normal leading-none tracking-[-0.08em]">
                Reuse
              </span>
            </div>
            <p className="mt-4 max-w-md text-base leading-7 text-[#0B3322]/85">
              Offer useful items for another home. Explore current offers to find something you can use.
            </p>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            {smallMetrics.map((metric) => (
              <article
                className="rounded-[1rem] border border-white/10 bg-[#163E2D] p-5"
                key={metric.value}
              >
                <p className="text-[2.6rem] font-normal leading-none tracking-[-0.06em] text-tc-shell-accent">
                  {metric.value}
                </p>
                <p className="mt-5 max-w-[12rem] text-base leading-7 text-[#CFE1D5]">
                  {metric.description}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-[1rem] border border-white/10 bg-white/5 px-5 py-4 text-base leading-8 text-[#CFE1D5]">
            <span className="font-semibold text-white">Neighbour-first browsing:</span>{' '}
            check the listing and collection arrangements before making a trip.
            <Link className="ml-2 font-semibold text-tc-shell-accent no-underline" to={browseTo}>
              Browse free items
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
