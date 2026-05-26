import { Link } from 'react-router-dom'

import logoSrc from '@/assets/logo.svg'

type LandingNavbarProps = {
  readonly dashboardTo: string
  readonly isAuthenticated: boolean
  readonly postItemTo: string
}

const navLinks = [
  { href: '#how', label: 'How it works' },
  { href: '#what-we-take', label: 'What we take' },
  { href: '#impact', label: 'Impact' },
  { href: '#faq', label: 'Questions' },
] as const

export function LandingNavbar({ dashboardTo, isAuthenticated, postItemTo }: LandingNavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-[#0B332212] bg-white/90 px-4 shadow-[0_18px_50px_rgba(11,51,34,0.08)] backdrop-blur-xl sm:px-6">
        <Link className="inline-flex items-center gap-2.5 no-underline" to="/">
          <img alt="TruCycle" className="h-10 w-10 rounded-2xl" src={logoSrc} />
          <span className="text-lg font-semibold tracking-[-0.03em] text-[#0B3322]">TruCycle</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <a
              className="text-sm font-bold tracking-[0.04em] text-[#172033] transition-colors hover:text-[#0B3322]"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAuthenticated ? (
            <Link
              className="hidden rounded-full px-4 py-2.5 text-base font-medium text-[#172033] no-underline transition-colors hover:text-[#0B3322] sm:inline-flex"
              to="/login"
            >
              Log in
            </Link>
          ) : null}
          <Link
            className="inline-flex items-center rounded-full bg-tc-shell-accent px-5 py-2.5 text-base font-extrabold text-[#0B3322] no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
            to={isAuthenticated ? dashboardTo : postItemTo}
          >
            {isAuthenticated ? 'Open dashboard' : 'Post an item'}
          </Link>
        </div>
      </div>
    </nav>
  )
}