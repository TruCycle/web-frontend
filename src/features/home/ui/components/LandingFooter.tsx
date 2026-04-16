import type { ComponentType, SVGProps } from 'react'

import { ArrowRight, Facebook, Instagram, Linkedin, Recycle, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'

type LandingFooterProps = {
  readonly isAuthenticated: boolean
  readonly primaryCtaTo: string
  readonly primaryCtaLabel: string
}

type SocialLink = {
  readonly label: string
  readonly href: string
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.83L6.15 22H3.03l7.24-8.28L1 2h6.25l4.32 6.18L18.9 2Zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20Z" />
    </svg>
  )
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35V2h-3.06v13.24a2.79 2.79 0 1 1-2.79-2.79c.23 0 .46.03.68.09V9.43a5.86 5.86 0 0 0-.68-.04A5.85 5.85 0 1 0 15.82 15V8.29a7.86 7.86 0 0 0 4.6 1.48V6.75c-.28 0-.56-.02-.83-.06Z" />
    </svg>
  )
}

const socialLinks: readonly SocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/14a4q94yc1A/',
    Icon: Facebook,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/realtrucycle?igsh=ZHdpdmszNHdkaWpx',
    Icon: Instagram,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/tru-cycle/',
    Icon: Linkedin,
  },
  {
    label: 'Twitter (X)',
    href: 'https://x.com/realTruCycle',
    Icon: XIcon,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@trucycle?_r=1&_t=ZN-95aQiv9dfDK',
    Icon: TikTokIcon,
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@realtrucycle?si=v5qTCnXQoex_W3Vs',
    Icon: Youtube,
  },
] as const

export function LandingFooter({ isAuthenticated, primaryCtaLabel, primaryCtaTo }: LandingFooterProps) {
  return (
    <footer className="relative overflow-hidden px-6 py-24">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(164,245,166,0.16)_0%,rgba(248,250,252,0.92)_52%,rgba(164,245,166,0.08)_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_70%)]" />

      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-tc-shell-bg text-white shadow-[0_14px_30px_rgba(35,35,35,0.14)]">
          <Recycle className="h-7 w-7" />
        </div>
        <h2 className="tc-landing-fade-up text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          Start moving things forward.
        </h2>
        <p className="tc-landing-fade-up tc-landing-delay-1 mx-auto mb-8 mt-4 max-w-xl text-lg leading-8 text-slate-600">
          Join your local community on TruCycle. It&apos;s free, fast, and designed for people who&apos;d rather act than scroll.
        </p>
        <Link
          className="tc-landing-fade-up tc-landing-delay-2 inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-8 py-4 text-base font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_40px_rgba(164,245,166,0.32)] transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
          to={primaryCtaTo}
        >
          {isAuthenticated ? primaryCtaLabel : 'Create your account'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mx-auto mt-20 flex max-w-7xl flex-col gap-8 border-t border-slate-900/10 pt-8 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Follow us</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:text-slate-950"
                href={href}
                rel="noreferrer"
                target="_blank"
                title={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
          <span>© {new Date().getFullYear()} TruCycle. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link className="no-underline transition-colors hover:text-slate-950" to="/privacy">
              Privacy
            </Link>
            <Link className="no-underline transition-colors hover:text-slate-950" to="/terms">
              Terms
            </Link>
            <Link className="no-underline transition-colors hover:text-slate-950" to={isAuthenticated ? '/dashboard' : '/login'}>
              {isAuthenticated ? 'Dashboard' : 'Log in'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}