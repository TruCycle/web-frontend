import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'

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
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f5ef_0%,_#f4efe2_26%,_#ecf4ef_62%,_#f8fafc_100%)] px-4 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[980px] flex-col gap-6">
        <header className="flex items-center justify-between gap-3 rounded-full border border-white/70 bg-white/75 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <Link className="inline-flex items-center gap-3 no-underline" to="/">
            <img alt="TruCycle" className="h-10 w-10 rounded-2xl" src={logoSrc} />
            <span className="text-lg font-bold tracking-[-0.02em] text-slate-950">TruCycle</span>
          </Link>

          <Link
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
            to="/"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </header>

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

        <footer className="mt-auto flex flex-col gap-4 rounded-[22px] border border-white/70 bg-white/70 px-4 py-5 text-sm text-slate-600 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="m-0 font-semibold text-slate-900">TruCycle</p>
              <p className="m-0 mt-1">Simple exchange for clothes and everyday items.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="text-slate-600 no-underline transition hover:text-slate-950" to="/privacy">
                Privacy
              </Link>
              <Link className="text-slate-600 no-underline transition hover:text-slate-950" to="/terms">
                Terms
              </Link>
            </div>
          </div>
          <p className="m-0 text-center text-xs text-slate-500">Copyright TruCycle 2026. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}