import { ArrowRight, Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import { useAuthSession } from '@/shared/context/useAuthSession'

interface LegalSection {
  readonly title: string
  readonly body: string
}

interface LegalPageLayoutProps {
  readonly eyebrow: string
  readonly title: string
  readonly intro: string
  readonly sections: readonly LegalSection[]
}

export function LegalPageLayout({
  eyebrow,
  title,
  intro,
  sections,
}: LegalPageLayoutProps) {
  const { isAuthenticated } = useAuthSession()
  const primaryCtaTo = isAuthenticated ? '/dashboard' : '/signup'
  const primaryCtaLabel = isAuthenticated ? 'Open dashboard' : 'Get Started'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(164,245,166,0.18)_0%,_rgba(248,250,252,0.98)_28%,_#f8fafc_100%)] text-slate-900">
      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
          <Link className="inline-flex items-center gap-2.5 no-underline" to="/">
            <img alt="TruCycle" className="h-10 w-10 rounded-2xl" src={logoSrc} />
            <span className="text-lg font-semibold tracking-[-0.03em] text-slate-950">TruCycle</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-tc-app-slate500 md:flex">
            <a className="transition-colors hover:text-slate-950" href="/#how">
              How it works
            </a>
            <a className="transition-colors hover:text-slate-950" href="/#why">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-tc-shell-accent px-5 py-2.5 text-sm font-semibold text-tc-shell-roleActiveText no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-shell-accentHover"
              to={primaryCtaTo}
            >
              {primaryCtaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex min-h-screen w-full max-w-[980px] flex-col gap-6 px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32">
        <section className="rounded-[22px] border border-white/70 bg-white/82 px-5 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur sm:px-8 sm:py-8">
          <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-tc-shell-bg sm:text-sm">{eyebrow}</p>
          <h1 className="mt-3 max-w-[12ch] text-[clamp(2.4rem,8vw,4.6rem)] font-bold leading-[0.95] tracking-[-0.05em] text-slate-950">
            {title}
          </h1>
          <p className="mt-4 max-w-[48rem] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {intro}
          </p>
        </section>

        <section className="grid gap-4 pb-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[22px] border border-white/70 bg-white/78 px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6"
            >
              <h2 className="m-0 text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">
                {section.title}
              </h2>
              <p className="m-0 mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <footer className="relative mt-auto overflow-hidden rounded-[22px] px-6 py-24">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(164,245,166,0.16)_0%,rgba(248,250,252,0.92)_52%,rgba(164,245,166,0.08)_100%)]" />
          <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_70%)]" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-tc-shell-bg text-white shadow-[0_14px_30px_rgba(35,35,35,0.14)]">
              <Recycle className="h-7 w-7" />
            </div>
            <h2 className="text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Start moving things forward.
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-xl text-lg leading-8 text-slate-600">
              Join your local community on TruCycle. It&apos;s free, fast, and designed for people who&apos;d rather act than scroll.
            </p>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-8 py-4 text-base font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_40px_rgba(164,245,166,0.32)] transition duration-200 hover:-translate-y-0.5 hover:bg-tc-shell-accentHover"
              to={primaryCtaTo}
            >
              {isAuthenticated ? primaryCtaLabel : 'Create your account'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-900/10 pt-8 text-sm text-slate-500 sm:flex-row">
            <span>© {new Date().getFullYear()} TruCycle. All rights reserved.</span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link className="no-underline transition-colors hover:text-slate-950" to="/cookies">
                Cookies
              </Link>
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
        </footer>
      </div>
    </main>
  )
}