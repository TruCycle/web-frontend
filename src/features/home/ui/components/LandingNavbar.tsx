import { ArrowRight, Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'

type LandingNavbarProps = {
  readonly isAuthenticated: boolean
  readonly primaryCtaTo: string
  readonly primaryCtaLabel: string
}

export function LandingNavbar({ isAuthenticated, primaryCtaLabel, primaryCtaTo }: LandingNavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
        <Link className="inline-flex items-center gap-2.5 no-underline" to="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tc-shell-bg text-white shadow-[0_10px_24px_rgba(35,35,35,0.18)]">
            <Recycle className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-[-0.03em] text-slate-950">TruCycle</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-tc-app-slate500 md:flex">
          <a className="transition-colors hover:text-slate-950" href="#how">
            How it works
          </a>
          <a className="transition-colors hover:text-slate-950" href="#why">
            Why TruCycle
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <Link
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-tc-app-slate500 no-underline transition-colors hover:text-slate-950 sm:inline-flex"
              to="/login"
            >
              Log in
            </Link>
          ) : null}
          <Link
            className="inline-flex items-center gap-1.5 rounded-full bg-tc-shell-accent px-5 py-2.5 text-sm font-semibold text-tc-shell-roleActiveText no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
            to={primaryCtaTo}
          >
            {primaryCtaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  )
}