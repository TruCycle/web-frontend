import { ArrowRight, Leaf, MapPinned, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

type LandingFoundItemsSectionProps = {
  readonly isAuthenticated: boolean
}

const foundItemHighlights = [
  {
    description: 'See nearby finds fast.',
    icon: MapPinned,
    title: 'Local board',
  },
  {
    description: 'Check the item details before arranging collection.',
    icon: Leaf,
    title: 'Check before collecting',
  },
  {
    description: 'Request, track, and report in one flow.',
    icon: ShieldCheck,
    title: 'Safer handoff tools',
  },
] as const

export function LandingFoundItemsSection({ isAuthenticated }: LandingFoundItemsSectionProps) {
  const primaryCtaTo = isAuthenticated ? '/found-items' : '/signup'
  const primaryCtaLabel = isAuthenticated ? 'Open board' : 'Start rescuing'
  const secondaryCtaTo = isAuthenticated ? '/map' : '/login'
  const secondaryCtaLabel = isAuthenticated ? 'Open map' : 'Log in'

  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6" id="found-items">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-tc-brand-haze" />

      <div className="mx-auto grid max-w-[1184px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <span className="tc-landing-fade-up inline-flex items-center gap-2 text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
            <Sparkles className="h-4 w-4 text-tc-brand-muted" />
            Found Items
          </span>

          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
            Catch nearby finds
            <br />
            before they become waste.
          </h2>

          <p className="tc-landing-fade-up tc-landing-delay-2 mt-4 max-w-xl text-base leading-[26px] text-tc-brand-body">
            Spot local finds, check the item details, and confirm permission before collecting.
          </p>

          <div className="mt-8 grid gap-3.5 sm:grid-cols-3">
            {foundItemHighlights.map((feature, index) => (
              <div
                className={`tc-landing-card rounded-tc-lg border border-tc-brand-line bg-white p-5 ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
                key={feature.title}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold leading-6 text-tc-brand-ink">{feature.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[22px] text-tc-brand-body">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="tc-landing-fade-up tc-landing-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 bg-tc-brand-deep text-white hover:bg-tc-brand-hover"
              to={primaryCtaTo}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 border border-tc-brand-control bg-transparent text-tc-brand-ink hover:bg-tc-brand-soft"
              to={secondaryCtaTo}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-4 top-6 -z-10 h-48 w-48 rounded-full bg-tc-brand-mint/20 blur-3xl" />

          <div className="tc-landing-card rounded-tc-xl border border-tc-brand-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
                  Illustrative board example � not a current listing
                </p>
                <h3 className="mt-2 text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">
                  Example armchair
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">0.8 km away · Barking riverside</p>
              </div>

              <span className="rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-deep">
                Example
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-tc-md bg-tc-brand-soft p-4">
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">Condition</p>
                <p className="mt-2 text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Check details</p>
              </div>
              <div className="rounded-tc-md bg-tc-brand-soft p-4">
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">Collection</p>
                <p className="mt-2 text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Agree first</p>
              </div>
              <div className="rounded-tc-md bg-tc-brand-deep p-4 text-white">
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-mint">Post flow</p>
                <p className="mt-2 text-xl font-semibold leading-7 tracking-[-0.015em]">Photo, pin, match</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}