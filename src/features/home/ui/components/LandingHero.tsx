import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImg from '@/assets/images/hero-abstract.jpg'

type LandingHeroProps = {
  readonly isAuthenticated: boolean
  readonly primaryCtaTo: string
  readonly primaryCtaLabel: string
}

const statPills = [
  { value: '10s', label: 'to list an item' },
  { value: '2 roles', label: 'donor & collector' },
  { value: '0 fees', label: 'always free' },
] as const

export function LandingHero({ isAuthenticated, primaryCtaTo }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-32 sm:pb-28 sm:pt-36">
      <div className="absolute inset-0 -z-10">
        <img alt="" className="h-full w-full object-cover opacity-25" src={heroImg} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.5)_0%,rgba(248,250,252,0.82)_38%,#f8fafc_100%)]" />
      </div>

      <div className="absolute left-1/2 top-20 -z-10 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-tc-shell-accent/25 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="tc-landing-fade-up mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-tc-shell-accent/40 bg-white/72 px-4 py-2 text-sm font-medium text-tc-shell-bg shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-tc-shell-accent" />
            Local exchange, reimagined
          </span>
        </div>

        <h1 className="tc-landing-fade-up tc-landing-delay-1 text-center text-[clamp(3.5rem,10vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.06em] text-slate-950">
          Give more.
          <br />
          <span className="text-tc-shell-accent">Waste less.</span>
        </h1>

        <p className="tc-landing-fade-up tc-landing-delay-2 mx-auto mb-10 mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600 sm:text-xl">
          The simplest way to exchange items with people near you. No feeds. No clutter. Just things moving forward.
        </p>

        <div className="tc-landing-fade-up tc-landing-delay-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-8 py-3.5 text-base font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_40px_rgba(164,245,166,0.32)] transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
            to={primaryCtaTo}
          >
            {isAuthenticated ? 'Open your dashboard' : 'Start exchanging'}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900/10 bg-white/45 px-8 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-white/80"
            href="#how"
          >
            See how it works
          </a>
        </div>

        {!isAuthenticated ? (
          <div className="tc-landing-fade-up tc-landing-delay-4 mt-4 flex justify-center">
            <Link className="text-sm font-medium text-slate-600 no-underline transition-colors hover:text-slate-950" to="/login">
              Already have an account? Log in
            </Link>
          </div>
        ) : null}

        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {statPills.map((stat, index) => (
            <div
              key={stat.value}
              className={`tc-landing-card flex items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/80 px-5 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
            >
              <span className="text-2xl font-bold tracking-[-0.04em] text-tc-shell-bg">{stat.value}</span>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}