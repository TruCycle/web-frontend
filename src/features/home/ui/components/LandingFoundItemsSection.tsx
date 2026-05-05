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
    description: 'Real CO2 and point previews.',
    icon: Leaf,
    title: 'Real impact preview',
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
    <section className="relative overflow-hidden px-6 py-24" id="found-items">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(164,245,166,0.22),_transparent_55%)]" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <span className="tc-landing-fade-up inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-tc-shell-bg">
            <Sparkles className="h-4 w-4 text-tc-shell-accent" />
            Found Items
          </span>

          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Catch nearby finds
            <br />
            before they become waste.
          </h2>

          <p className="tc-landing-fade-up tc-landing-delay-2 mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Spot local finds, request pickup, and see the impact before anything goes live.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {foundItemHighlights.map((feature, index) => (
              <div
                className={`tc-landing-card rounded-[1.6rem] border border-slate-200 bg-white/90 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
                key={feature.title}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-tc-shell-accent/18 text-tc-shell-bg">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="tc-landing-fade-up tc-landing-delay-3 mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-8 py-3.5 text-base font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_40px_rgba(164,245,166,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
              to={primaryCtaTo}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3.5 text-base font-medium text-slate-700 no-underline transition-colors hover:bg-slate-50"
              to={secondaryCtaTo}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-4 top-6 -z-10 h-48 w-48 rounded-full bg-tc-shell-accent/16 blur-3xl" />

          <div className="tc-landing-card rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tc-shell-bg/70">
                  Board preview
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                  Morland Road armchair
                </h3>
                <p className="mt-2 text-base text-slate-500">0.8 km away · Barking riverside</p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Available
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[#f4faea] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CO2e saved</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">12 kg</p>
              </div>
              <div className="rounded-[1.4rem] bg-[#eef6de] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Impact score</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#3A7618]">86 pts</p>
              </div>
              <div className="rounded-[1.4rem] bg-slate-950 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Post flow</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">Photo, pin, match</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}