import { useEffect, useRef } from 'react'
import { ArrowRight, CircleUserRound, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import { useLandingBrowseItems } from '@/features/home/hooks/useLandingBrowseItems'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useUserRole } from '@/shared/context/useUserRole'

const signalCards = [
  {
    value: '10 sec',
    label: 'to start a listing',
  },
  {
    value: '2 modes',
    label: 'collector and donor',
  },
  {
    value: 'Less waste',
    label: 'more items in use',
  },
] as const

const stepCards = [
  {
    title: 'Add',
    body: 'Upload an item and keep it moving.',
  },
  {
    title: 'Match',
    body: 'Nearby people see what is ready now.',
  },
  {
    title: 'Exchange',
    body: 'Simple handoff. Clear status. Done.',
  },
] as const

const roleCards = [
  {
    title: 'Collector',
    body: 'Browse, select, and follow every pickup.',
    tone: 'bg-[#f6efe3]',
  },
  {
    title: 'Donor',
    body: 'List, manage, and move items on quickly.',
    tone: 'bg-[#e8f2ed]',
  },
] as const

export default function HomePage() {
  const { user, isAuthenticated } = useAuthSession()
  const { role } = useUserRole()
  const { items: latestItems, isLoading: isLoadingLatestItems, error: latestItemsError } = useLandingBrowseItems(10)
  const latestItemsScrollerRef = useRef<HTMLDivElement | null>(null)
  const latestItemsGroupRef = useRef<HTMLDivElement | null>(null)
  const initials = `${user?.firstName?.[0] ?? 'T'}${user?.lastName?.[0] ?? ''}`.toUpperCase()
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Profile'
  const dashboardLabel = role === 'donor' ? 'Donor dashboard' : 'Collector dashboard'

  useEffect(() => {
    const container = latestItemsScrollerRef.current
    const group = latestItemsGroupRef.current

    if (!container || !group || latestItems.length < 2) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let frameId = 0
    let lastTime = 0
    const loopWidth = group.offsetWidth + 16

    const animate = (time: number) => {
      if (lastTime === 0) {
        lastTime = time
      }

      const delta = time - lastTime
      lastTime = time
      container.scrollLeft += delta * 0.03

      if (container.scrollLeft >= loopWidth) {
        container.scrollLeft -= loopWidth
      }

      frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [latestItems.length])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f5ef_0%,_#f4efe2_26%,_#ecf4ef_62%,_#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-10">
        <header className="tc-landing-fade-up flex items-center justify-between gap-3 rounded-full border border-white/70 bg-white/75 px-3 py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-4 lg:px-6">
          <Link className="inline-flex items-center gap-3 no-underline" to="/">
            <img alt="TruCycle" className="h-9 w-9 rounded-2xl sm:h-10 sm:w-10" src={logoSrc} />
            <span className="text-base font-bold tracking-[-0.02em] text-slate-950 sm:text-lg">TruCycle</span>
          </Link>

          {isAuthenticated ? (
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 no-underline transition hover:-translate-y-0.5 hover:shadow-lg"
              to="/dashboard"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-tc-shell-bg text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm">
                {initials}
              </span>
              <span className="flex max-w-[8.25rem] flex-col text-left sm:max-w-[9rem]">
                <span className="truncate leading-tight text-slate-950">{displayName}</span>
                <span className="truncate text-[11px] text-slate-500">{dashboardLabel}</span>
              </span>
            </Link>
          ) : (
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-tc-shell-accent px-4 py-3 text-sm font-semibold text-tc-shell-roleActiveText no-underline transition hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
              to="/signup"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          )}
        </header>

        <section className="grid gap-6 py-6 sm:gap-8 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
          <div className="max-w-[620px]">
            <span className="tc-landing-fade-up tc-landing-delay-1 inline-flex rounded-full border border-[#232323]/10 bg-white/75 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-tc-shell-bg shadow-sm backdrop-blur sm:text-sm">
              Swap less waste for simple local exchange
            </span>
            <h1 className="tc-landing-fade-up tc-landing-delay-2 mt-4 max-w-[9ch] text-[clamp(2.8rem,13vw,6.1rem)] font-bold leading-[0.92] tracking-[-0.065em] text-slate-950 sm:mt-5">
              Clothes in.
              <br />
              Value out.
            </h1>
            <p className="tc-landing-fade-up tc-landing-delay-3 mt-4 max-w-[32rem] text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
              One clean place to give, find, and move items forward.
            </p>

            <div className="tc-landing-fade-up tc-landing-delay-4 mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-6 py-3.5 text-sm font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_45px_rgba(164,245,166,0.28)] transition hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
                to={isAuthenticated ? '/dashboard' : '/signup'}
              >
                {isAuthenticated ? 'Open dashboard' : 'Get Started'}
                <ArrowRight size={16} />
              </Link>
              {!isAuthenticated ? (
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 no-underline transition hover:-translate-y-0.5 hover:shadow-md"
                  to="/login"
                >
                  <CircleUserRound size={16} />
                  Log in
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <article className="tc-landing-card tc-landing-delay-2 overflow-hidden rounded-[22px] bg-tc-shell-bg p-5 text-white shadow-[0_22px_60px_rgba(35,35,35,0.22)] sm:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
                <Sparkles size={12} />
                Quick signal
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {signalCards.map((card) => (
                  <div key={card.value} className="rounded-[16px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <p className="m-0 text-xl font-semibold sm:text-2xl">{card.value}</p>
                    <p className="mt-1 text-sm leading-6 text-white/72">{card.label}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="tc-landing-card tc-landing-delay-4 grid gap-4 rounded-[22px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-tc-shell-bg sm:text-sm">Shared dashboard</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Start where work happens.</h2>
                </div>
                <span className="rounded-full bg-[#ececec] px-3 py-1 text-sm font-semibold text-tc-shell-bg">/dashboard</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {roleCards.map((card) => (
                  <div key={card.title} className={`rounded-[16px] p-4 ${card.tone}`}>
                    <p className="m-0 text-sm font-semibold text-slate-500">{card.title}</p>
                    <p className="mt-2 text-base font-medium text-slate-900">{card.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="tc-landing-fade-up tc-landing-delay-2 rounded-[22px] border border-white/70 bg-white/78 px-4 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-tc-shell-bg sm:text-sm">Latest listed items</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Ready for exchange now.</h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-tc-shell-bg no-underline transition hover:gap-3"
              to={isAuthenticated ? '/browse' : '/signup'}
            >
              {isAuthenticated ? 'Browse more' : 'View after signup'}
              <ArrowRight size={16} />
            </Link>
          </div>

          {latestItemsError ? (
            <p className="mt-4 rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm text-slate-600">
              Live items are not available right now.
            </p>
          ) : null}

          <div ref={latestItemsScrollerRef} className="tc-landing-scroll mt-5 overflow-x-auto pb-2">
            {isLoadingLatestItems ? (
              <div className="flex w-max gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`landing-item-skeleton-${index}`} className="w-[240px] rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm sm:w-[280px]">
                    <div className="tc-shimmer-block h-44 rounded-[14px]" />
                    <div className="mt-3 space-y-2">
                      <span className="tc-shimmer-block block h-4 w-20 rounded-full" />
                      <span className="tc-shimmer-block block h-6 w-2/3 rounded-lg" />
                      <span className="tc-shimmer-block block h-4 w-1/2 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : latestItems.length > 0 ? (
              <div className="flex w-max gap-4">
                <div ref={latestItemsGroupRef} className="flex gap-4">
                  {latestItems.map((item) => (
                    <article key={item.id} className="tc-landing-card w-[240px] rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm sm:w-[280px]">
                      {item.image ? (
                        <img alt={item.image.altText ?? item.title} className="h-44 w-full rounded-[14px] object-cover" src={item.image.url} />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center rounded-[14px] bg-[#eef2f7] text-sm text-slate-500">
                          No image
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#ececec] px-2.5 py-1 text-xs font-semibold text-tc-shell-bg">{item.category}</span>
                          <span className="rounded-full bg-[#f6efe3] px-2.5 py-1 text-xs font-semibold text-slate-700">{item.condition}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.locationLabel}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-400">Ready now</p>
                          <Link
                            className="inline-flex items-center gap-2 rounded-full bg-tc-shell-accent px-3.5 py-2 text-xs font-semibold text-tc-shell-roleActiveText no-underline transition hover:bg-tc-action-primaryHover"
                            to={isAuthenticated ? '/browse' : '/signup'}
                          >
                            {isAuthenticated ? 'Open' : 'Get access'}
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div aria-hidden className="flex gap-4">
                  {latestItems.map((item) => (
                    <article key={`${item.id}-clone`} className="tc-landing-card w-[240px] rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm sm:w-[280px]">
                      {item.image ? (
                        <img alt="" className="h-44 w-full rounded-[14px] object-cover" src={item.image.url} />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center rounded-[14px] bg-[#eef2f7] text-sm text-slate-500">
                          No image
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#ececec] px-2.5 py-1 text-xs font-semibold text-tc-shell-bg">{item.category}</span>
                          <span className="rounded-full bg-[#f6efe3] px-2.5 py-1 text-xs font-semibold text-slate-700">{item.condition}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.locationLabel}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="m-0 text-xs uppercase tracking-[0.16em] text-slate-400">Ready now</p>
                          <span className="inline-flex items-center gap-2 rounded-full bg-tc-shell-accent px-3.5 py-2 text-xs font-semibold text-tc-shell-roleActiveText">
                            Looping
                            <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm text-slate-600">
                No live items yet.
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 py-6 sm:gap-5 sm:py-8 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="tc-landing-fade-up tc-landing-delay-3 rounded-[22px] bg-tc-shell-bg px-5 py-6 text-white shadow-[0_22px_60px_rgba(35,35,35,0.22)] sm:px-6">
            <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:text-sm">How it moves</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Short flow. No clutter.</h2>
            <div className="mt-5 grid gap-3">
              {stepCards.map((card, index) => (
                <div key={card.title} className="rounded-[16px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">0{index + 1}</span>
                    <div>
                      <p className="m-0 text-lg font-semibold">{card.title}</p>
                      <p className="m-0 mt-1 text-sm leading-6 text-white/72">{card.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="tc-landing-fade-up tc-landing-delay-4 rounded-[22px] border border-white/70 bg-white/82 px-5 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.09)] backdrop-blur sm:px-6">
            <p className="m-0 text-xs font-medium uppercase tracking-[0.18em] text-tc-shell-bg sm:text-sm">Why it works</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">Built for fast repeat exchange.</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-[#f7f4ec] p-4">
                <p className="m-0 text-sm font-semibold text-slate-500">Clean status</p>
                <p className="mt-2 text-base font-medium text-slate-900">You always know what is active, claimed, or done.</p>
              </div>
              <div className="rounded-[16px] bg-[#ececec] p-4">
                <p className="m-0 text-sm font-semibold text-slate-500">Local view</p>
                <p className="mt-2 text-base font-medium text-slate-900">Nearby items surface first, so exchange stays practical.</p>
              </div>
              <div className="rounded-[16px] bg-[#eef2f7] p-4 sm:col-span-2">
                <p className="m-0 text-sm font-semibold text-slate-500">Less noise</p>
                <p className="mt-2 text-base font-medium text-slate-900">Simple cards, fast actions, and a dashboard that opens right where work starts.</p>
              </div>
            </div>
          </article>
        </section>

        <footer className="tc-landing-fade-up tc-landing-delay-4 mt-auto flex flex-col gap-3 rounded-[22px] border border-white/70 bg-white/70 px-4 py-5 text-sm text-slate-600 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="m-0 font-semibold text-slate-900">TruCycle</p>
            <p className="m-0 mt-1">Simple exchange for clothes and everyday items.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="text-slate-600 no-underline transition hover:text-slate-950" to={isAuthenticated ? '/dashboard' : '/signup'}>
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>
            <Link className="text-slate-600 no-underline transition hover:text-slate-950" to={isAuthenticated ? '/settings' : '/login'}>
              {isAuthenticated ? 'Profile' : 'Login'}
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
