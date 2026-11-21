import { ArrowRight, Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import { useAuthSession } from '@/shared/context/useAuthSession'
import type { ReactNode } from 'react'
import { CompanyDetails } from '@/shared/ui/legal/CompanyDetails'

interface LegalSection {
  readonly title: string
  readonly body: string
}

interface LegalPageLayoutProps {
  readonly eyebrow: string
  readonly title: string
  readonly intro: string
  readonly sections: readonly LegalSection[]
  readonly children?: ReactNode
}

export function LegalPageLayout({
  eyebrow,
  title,
  intro,
  sections,
  children,
}: LegalPageLayoutProps) {
  const { isAuthenticated } = useAuthSession()
  const primaryCtaTo = isAuthenticated ? '/dashboard' : '/signup'
  const primaryCtaLabel = isAuthenticated ? 'Open dashboard' : 'Get Started'

  return (
    <main className="min-h-screen overflow-x-hidden bg-tc-brand-haze text-tc-brand-ink">
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center justify-between gap-3 rounded-full bg-tc-brand-deep pl-4 pr-2.5 shadow-tc-raised sm:pl-5 sm:pr-3">
          <Link className="inline-flex items-center gap-2.5 no-underline" to="/">
            <img alt="TruCycle" className="h-8 w-8 rounded-full" src={logoSrc} />
            <span className="hidden text-lg font-semibold tracking-[-0.02em] text-white sm:inline">TruCycle</span>
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium text-tc-brand-onDeep md:flex">
            <a className="rounded-full px-3.5 py-2.5 text-tc-brand-onDeep no-underline transition-colors hover:text-white" href="/#how">
              How it works
            </a>
            <Link className="rounded-full px-3.5 py-2.5 text-tc-brand-onDeep no-underline transition-colors hover:text-white" to="/browse">Browse items</Link>
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
              className="inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-tc-brand-mint px-3.5 text-sm font-semibold text-tc-brand-onMint no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-brand-mintHover sm:px-[18px]"
              to={primaryCtaTo}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex min-h-screen w-full max-w-[868px] flex-col gap-4 px-4 pb-6 pt-28 sm:px-6 sm:pt-[136px]">
        <section className="rounded-tc-xl border border-tc-brand-mintLine bg-tc-brand-mintSoft p-6 sm:p-8">
          <p className="m-0 text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-body">{eyebrow}</p>
          <h1 className="mt-2 text-[clamp(2.25rem,6vw,3rem)] font-semibold leading-[1.125] tracking-[-0.03em] text-tc-brand-ink">
            {title}
          </h1>
          <p className="mt-3 max-w-[48rem] text-base leading-[26px] text-tc-brand-body">
            {intro}
          </p>
        </section>

        <section className="grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-tc-lg border border-tc-brand-line bg-white p-5 sm:p-6"
            >
              <h2 className="m-0 text-lg font-semibold leading-6 text-tc-brand-ink">
                {section.title}
              </h2>
              <p className="m-0 mt-2 text-sm leading-6 text-tc-brand-body">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        {children}
        <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5 text-sm leading-6 text-tc-brand-body sm:p-6"><CompanyDetails /></div>
        <footer className="relative mt-auto overflow-hidden rounded-tc-xl bg-tc-brand-deep px-6 pb-8 pt-12 text-tc-brand-onDeep sm:px-10 sm:pt-14">
          <div className="absolute inset-0 -z-10 bg-tc-brand-deep" />
          <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-tc-brand-deep" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-mint text-tc-brand-onMint">
              <Recycle className="h-6 w-6" />
            </div>
            <h2 className="text-[clamp(1.75rem,4.6vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
              Start moving things forward.
            </h2>
            <p className="mx-auto mb-6 mt-3 max-w-xl text-base leading-[26px] text-tc-brand-onDeep">
              Offer something useful, describe it clearly, and agree a handover with its next owner.
            </p>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-tc-brand-mint px-[22px] text-[15px] font-semibold text-tc-brand-onMint no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-brand-mintHover"
              to={primaryCtaTo}
            >
              {isAuthenticated ? primaryCtaLabel : 'Create your account'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-tc-brand-deepLine pt-5 text-[13px] leading-5 text-tc-brand-onDeep sm:flex-row">
            <span>© {new Date().getFullYear()} TruCycle Ltd. All rights reserved.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <Link className="inline-flex min-h-11 items-center text-white no-underline transition-colors hover:text-tc-brand-mint" to="/cookies">
                Cookies
              </Link>
              <Link className="inline-flex min-h-11 items-center text-white no-underline transition-colors hover:text-tc-brand-mint" to="/privacy">
                Privacy
              </Link>
              <Link className="inline-flex min-h-11 items-center text-white no-underline transition-colors hover:text-tc-brand-mint" to="/terms">
                Terms
              </Link>
              <Link className="inline-flex min-h-11 items-center text-white no-underline transition-colors hover:text-tc-brand-mint" to={isAuthenticated ? '/dashboard' : '/login'}>
                {isAuthenticated ? 'Dashboard' : 'Log in'}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
