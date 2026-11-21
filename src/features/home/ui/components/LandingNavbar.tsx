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
    <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center justify-between gap-3 rounded-full bg-tc-brand-deep pl-4 pr-2.5 shadow-tc-raised sm:pl-5 sm:pr-3">
        <Link aria-label="TruCycle home" className="inline-flex shrink-0 items-center gap-2.5 no-underline" to="/">
          <img alt="" className="h-8 w-8 rounded-full" src={logoSrc} />
          <span className="max-[360px]:hidden text-lg font-semibold tracking-[-0.02em] text-white">TruCycle</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) =>
            'to' in link && link.to ? (
              <Link
                className="whitespace-nowrap rounded-full px-2 py-2.5 text-sm font-medium text-tc-brand-onDeep no-underline transition-colors hover:text-white xl:px-3.5"
                to={link.to}
                key={link.label}
              >
                {link.label}
              </Link>
            ) : (
              <a
                className="whitespace-nowrap rounded-full px-2 py-2.5 text-sm font-medium text-tc-brand-onDeep no-underline transition-colors hover:text-white xl:px-3.5"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </a>
            ),
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!isAuthenticated ? (
            <Link
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2.5 text-sm font-semibold text-white no-underline transition-colors hover:text-tc-brand-mint sm:px-3.5"
              to="/login"
            >
              Log in
            </Link>
          ) : null}
          <Link
            className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-tc-brand-mint px-3.5 text-sm font-semibold text-tc-brand-onMint no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-brand-mintHover sm:px-[18px]"
            to={isAuthenticated ? dashboardTo : postItemTo}
          >
            {isAuthenticated ? 'Open dashboard' : 'Post an item'}
          </Link>
        </div>
      </div>
    </nav>
  )
}
