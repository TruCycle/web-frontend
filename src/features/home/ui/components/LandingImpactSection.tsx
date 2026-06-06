import { Link } from 'react-router-dom'

type LandingImpactSectionProps = {
  readonly browseTo: string
  readonly impactTo: string
  readonly partnerTo: string
}

const smallMetrics = [
  {
    description: 'of items collected within 48 hours of listing',
    value: '94%',
  },
  {
    description: 'average cost to list - and always will be',
    value: '£0',
  },
] as const

export function LandingImpactSection({ browseTo, impactTo, partnerTo }: LandingImpactSectionProps) {
  return (
    <section className="bg-[#0B3322] px-6 py-20 text-white sm:py-24" id="impact">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[405px_minmax(0,1fr)] lg:items-center lg:gap-[3.125rem]">
        <div className="space-y-[1.125rem]">
          <p className="text-sm font-bold tracking-[0.04em] text-tc-shell-accent">
            Why it matters
          </p>

          <div className="space-y-2 text-[clamp(2.55rem,5vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.05em]">
            <p>Every item rehomed</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>is one</span>
              <span className="text-tc-shell-accent">not in the</span>
            </div>
            <p className="text-tc-shell-accent">ground.</p>
          </div>

          <p className="max-w-[25rem] text-[1.05rem] leading-8 text-[#C9D8CF]">
            London chucks more than 3 million tonnes of stuff into landfill each
            year. A lot of it is perfectly usable furniture, white goods and
            household kit. TruCycle moves those things sideways - neighbour to
            neighbour - instead of down.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-[#0D3B24] px-6 py-3 text-base font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to={impactTo}
            >
              Read the impact report -&gt;
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-base font-bold text-white no-underline transition-colors duration-200 hover:bg-white/5"
              to={partnerTo}
            >
              Partner with us
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.1rem] bg-tc-shell-accent p-6 text-[#0B3322] shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="flex items-start gap-2">
              <span className="text-[clamp(3.3rem,8vw,4.8rem)] font-normal leading-none tracking-[-0.08em]">
                38
              </span>
              <span className="mt-4 text-3xl font-normal leading-none">t</span>
            </div>
            <p className="mt-4 max-w-md text-base leading-7 text-[#0B3322]/85">
              tonnes of household goods diverted from London landfill this year
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
            browse locally, save collection miles, and keep handovers practical.
            <Link className="ml-2 font-semibold text-tc-shell-accent no-underline" to={browseTo}>
              Browse free items
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}