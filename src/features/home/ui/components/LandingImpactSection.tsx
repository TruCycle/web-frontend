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
    <section className="bg-tc-brand-haze px-4 py-6 text-white sm:px-6" id="impact">
      <div className="mx-auto grid max-w-[1184px] gap-12 rounded-tc-xl bg-tc-brand-deep px-6 py-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14 lg:px-16 lg:py-[72px]">
        <div className="space-y-[18px]">
          <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-mint">
            Why it matters
          </p>

          <div className="space-y-0 text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white">
            <p>Give useful things</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0">
              <span>a chance</span>
              <span className="text-white">at another</span>
            </div>
            <p className="text-white">home.</p>
          </div>

          <p className="max-w-[440px] text-base leading-[26px] text-tc-brand-onDeep">
            Reuse starts with an item someone can use and a handoff both people
            agree to. Offer it clearly, check its condition, and arrange a
            practical collection together.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <a
              className="inline-flex min-h-11 items-center justify-center self-start text-[15px] font-semibold text-tc-brand-mint no-underline transition-colors hover:text-tc-brand-mintHover"
              href="#how"
            >
              See how reuse works -&gt;
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <article className="order-2 rounded-tc-lg bg-tc-brand-mintSoft p-6 text-tc-brand-ink">
            <div className="flex items-start gap-2">
              <span className="text-lg font-semibold leading-6 text-tc-brand-ink">
                Reuse
              </span>
            </div>
            <p className="mt-1 max-w-md text-[15px] leading-[22px] text-tc-brand-body">
              Offer useful items for another home. Explore current offers to find something you can use.
            </p>
          </article>

          <div className="order-1 grid gap-3.5 sm:grid-cols-2">
            {smallMetrics.map((metric) => (
              <article
                className="rounded-tc-lg border border-tc-brand-deepLine bg-tc-brand-hover p-[22px]"
                key={metric.value}
              >
                <p className="text-[26px] font-semibold leading-8 tracking-[-0.02em] text-white">
                  {metric.value}
                </p>
                <p className="mt-1.5 text-[15px] leading-[22px] text-tc-brand-onDeep">
                  {metric.description}
                </p>
              </article>
            ))}
          </div>

          <div className="order-3 rounded-tc-lg border border-tc-brand-deepLine bg-tc-brand-hover px-[22px] py-4 text-[15px] leading-[22px] text-tc-brand-onDeep">
            <span className="font-semibold text-white">Neighbour-first browsing:</span>{' '}
            check the listing and collection arrangements before making a trip.
            <Link className="ml-2 font-semibold text-tc-brand-mint no-underline hover:text-tc-brand-mintHover" to={browseTo}>
              Browse free items
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
