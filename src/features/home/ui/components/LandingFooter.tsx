import type { ComponentType, SVGProps } from 'react'

import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'

import logoSrc from '@/assets/logo.svg'

type SocialLink = {
  readonly href: string
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>
  readonly label: string
}

type LandingFooterProps = {
  readonly postItemTo: string
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

export function LandingFooter({ postItemTo }: LandingFooterProps) {
  return (
    <footer className="bg-[#0B3322] px-6 py-14 text-white sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-[4.375rem]">
          <div className="space-y-[1.125rem]">
            <Link className="flex items-center gap-3 no-underline" to="/">
              <img alt="TruCycle" className="h-9 w-9 rounded-full" src={logoSrc} />
              <span className="text-[1.75rem] font-normal tracking-[-0.04em] text-white">
                TruCycle
              </span>
            </Link>

            <p className="max-w-[19rem] text-base leading-7 text-[#E8F6EE]">
              Neighbour-to-neighbour reuse for London homes, studios, flats, and
              families.
            </p>

            <Link
              className="inline-flex rounded-full bg-tc-shell-accent px-6 py-3 text-base font-extrabold text-[#0B3322] no-underline transition-transform duration-200 hover:-translate-y-0.5"
              to={postItemTo}
            >
              Post something free -&gt;
            </Link>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <p className="text-base font-semibold tracking-[0.02em] text-[#E8F6EE] lg:text-right">
              Follow us on all social platforms
            </p>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  aria-label={label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#E8F6EE] transition duration-200 hover:-translate-y-0.5 hover:border-tc-shell-accent hover:text-tc-shell-accent"
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

        <div className="mt-14 space-y-4">
          <div className="h-px w-full bg-white/15" />
          <div className="flex flex-col gap-4 text-sm font-medium tracking-[0.04em] text-[#E8F6EE] sm:flex-row sm:items-center sm:justify-between">
            <span>{new Date().getFullYear()} TruCycle. Free neighbour-to-neighbour handovers.</span>
            <div className="flex flex-wrap gap-5">
              <Link className="text-[#E8F6EE] no-underline" to="/privacy">
                Privacy
              </Link>
              <Link className="text-[#E8F6EE] no-underline" to="/terms">
                Terms
              </Link>
              <a className="text-[#E8F6EE] no-underline" href="mailto:hello@trucycle.co.uk?subject=Accessibility">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}