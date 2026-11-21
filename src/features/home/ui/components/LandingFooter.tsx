import type { ComponentType, SVGProps } from 'react'

import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'

import logoSrc from '@/assets/logo.svg'

type SocialLink = {
  readonly href: string
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>
  readonly label: string
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

export function LandingFooter() {
  return (
    <footer className="bg-tc-brand-haze px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1184px] rounded-tc-xl bg-tc-brand-deep px-6 pb-8 pt-10 sm:px-10 lg:px-16 lg:pt-14">
        <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
          <div className="space-y-4">
            <Link className="flex items-center gap-2.5 no-underline" to="/">
              <img alt="TruCycle" className="h-8 w-8 rounded-full" src={logoSrc} />
              <span className="text-lg font-semibold tracking-[-0.02em] text-white">
                TruCycle
              </span>
            </Link>

            <p className="max-w-[20rem] text-[15px] leading-6 text-tc-brand-onDeep">
              Neighbour-to-neighbour reuse for homes, studios, flats, and
              families.
            </p>

          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <p className="text-sm font-semibold leading-5 text-white lg:text-right">
              Follow us on all social platforms
            </p>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-tc-brand-deepLine bg-tc-brand-hover text-tc-brand-onDeep transition duration-200 hover:-translate-y-0.5 hover:border-tc-brand-mint hover:text-tc-brand-mint"
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
        </div>

        <div className="mt-10 space-y-5">
          <div className="h-px w-full bg-tc-brand-deepLine" />
          <div className="flex flex-col gap-4 text-[13px] leading-5 text-tc-brand-onDeep sm:flex-row sm:items-center sm:justify-between">
            <span>{new Date().getFullYear()} TruCycle. Free neighbour-to-neighbour handovers.</span>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <Link className="inline-flex min-h-11 items-center text-tc-brand-onDeep no-underline transition-colors hover:text-white" to="/privacy">
                Privacy
              </Link>
              <Link className="inline-flex min-h-11 items-center text-tc-brand-onDeep no-underline transition-colors hover:text-white" to="/terms">
                Terms
              </Link>
              <a className="inline-flex min-h-11 items-center text-tc-brand-onDeep no-underline transition-colors hover:text-white" href="mailto:hello@trucycle.co.uk?subject=Accessibility">
                Email us about accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
