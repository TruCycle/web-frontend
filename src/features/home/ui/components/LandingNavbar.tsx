import { Link } from 'react-router-dom'

import logoSrc from '@/assets/logo.svg'

type LandingNavbarProps = {
  readonly dashboardTo: string
  readonly isAuthenticated: boolean
  readonly postItemTo: string
}

const navLinks = [
  { to: '/browse', label: 'Browse items' },
  { href: '/#explore-items', label: 'Top categories' },
  { href: '/#how', label: 'How it works' },
  { href: '/#what-we-take', label: 'What to offer' },
  { href: '/#impact', label: 'Why reuse' },
  { href: '/#faq', label: 'Questions' },
]

export function LandingNavbar({ dashboardTo, isAuthenticated, postItemTo }: LandingNavbarProps) {
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-tc-brand-deep/[.07] bg-white/90 px-4 shadow-[0_18px_50px_rgba(15,42,30,0.08)] backdrop-blur-xl sm:px-6">
        <Link aria-label="TruCycle home" className="inline-flex shrink-0 items-center gap-2.5 no-underline" to="/">
          <img alt="" className="h-10 w-10 rounded-2xl" src={logoSrc} />
          <span className="max-[360px]:hidden text-lg font-semibold tracking-[-0.03em] text-tc-brand-deep">TruCycle</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) =>
            'to' in link && link.to ? (
              <Link
                className="text-sm font-bold tracking-[0.04em] text-tc-brand-ink no-underline transition-colors hover:text-tc-brand-deep"
                to={link.to}
                key={link.label}
              >
                {link.label}
              </Link>
            ) : (
              <a
                className="text-sm font-bold tracking-[0.04em] text-tc-brand-ink transition-colors hover:text-tc-brand-deep"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </a>
            ),
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <Link
              className="inline-flex whitespace-nowrap rounded-full px-2 py-2.5 sm:px-4 text-base font-medium text-tc-brand-ink no-underline transition-colors hover:text-tc-brand-deep"
              to="/login"
            >
              Log in
            </Link>
          ) : null}
          <Link
            className="inline-flex whitespace-nowrap items-center rounded-full bg-tc-brand-deep px-3 py-2.5 text-sm sm:px-5 sm:text-base font-extrabold text-tc-brand-surface no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-brand-hover"
            to={isAuthenticated ? dashboardTo : postItemTo}
          >
            {isAuthenticated ? 'Open dashboard' : 'Post an item'}
          </Link>
        </div>
      </div>
    </nav>
  )
}
