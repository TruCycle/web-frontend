import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import heroImg from '@/assets/images/hero-abstract.jpg'
import bagShoeImg from '@/assets/images/bag-shoe.jpg'
import bookPlannerImg from '@/assets/images/book-planner.jpg'
import ipadImg from '@/assets/images/ipad.jpg'
import scentedCandleImg from '@/assets/images/scented-candle.jpg'

type LandingHeroProps = {
  readonly isAuthenticated: boolean
  readonly primaryCtaTo: string
  readonly primaryCtaLabel: string
}

const statPills = [
  { value: '10s', label: 'to list an item' },
  { value: '3 roles', label: 'spotter, collector, donor' },
  { value: '0 fees', label: 'always free' },
] as const

const heroImages: readonly string[] = [
  heroImg,
  bagShoeImg,
  bookPlannerImg,
  ipadImg,
  scentedCandleImg,
]

const ROTATION_INTERVAL_MS = 6000

type IntentCta = {
  readonly to: string
  readonly label: string
}

function getPersistedRole(): 'spotter' | 'collector' | 'donor' | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('tc.activeRole')
    if (raw === 'spotter' || raw === 'collector' || raw === 'donor') return raw
  } catch {
    // ignore
  }
  return null
}

function intentToCta(
  intent: string | null,
  persistedRole: 'spotter' | 'collector' | 'donor' | null,
  isAuthenticated: boolean,
): IntentCta | null {
  const target = intent ?? persistedRole
  if (!target) return null

  const baseTo = isAuthenticated
    ? target === 'spotter'
      ? '/found-items/post'
      : target === 'donor'
      ? '/listings'
      : '/nearby'
    : '/signup'

  if (target === 'spotter') return { to: baseTo, label: 'Spot an item' }
  if (target === 'donor') return { to: baseTo, label: 'List an item' }
  if (target === 'collector') return { to: baseTo, label: 'Start rescuing' }
  return null
}

export function LandingHero({ isAuthenticated, primaryCtaTo, primaryCtaLabel }: LandingHeroProps) {
  const [searchParams] = useSearchParams()
  const [activeImage, setActiveImage] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (reduceMotion || heroImages.length <= 1) return
    const id = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  // Lazy-decode all but the first image after mount so the first paint stays fast.
  useEffect(() => {
    heroImages.slice(1).forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  const intentCta = useMemo(
    () => intentToCta(searchParams.get('intent'), getPersistedRole(), isAuthenticated),
    [isAuthenticated, searchParams],
  )

  const ctaTo = intentCta?.to ?? primaryCtaTo
  const ctaLabel = intentCta?.label ?? (isAuthenticated ? 'Open your dashboard' : primaryCtaLabel || 'Start rescuing')

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden px-6 pb-16 pt-28 sm:pb-24 sm:pt-32">
      <div className="absolute inset-0 -z-10">
        {heroImages.map((src, index) => (
          <img
            key={src}
            alt=""
            aria-hidden
            src={src}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
              index === activeImage ? 'opacity-25' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.5)_0%,rgba(248,250,252,0.82)_38%,#f8fafc_100%)]" />
      </div>

      <div className="absolute left-1/2 top-20 -z-10 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-tc-shell-accent/25 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="tc-landing-fade-up mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-tc-shell-accent/40 bg-white/72 px-4 py-2 text-sm font-medium text-tc-shell-bg shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-tc-shell-accent" />
            Local exchange, reimagined
          </span>
        </div>

        <h1 className="tc-landing-fade-up tc-landing-delay-1 text-center text-[clamp(3.5rem,10vw,7rem)] font-extrabold leading-[0.92] tracking-[-0.06em] text-slate-950">
          Give more.
          <br />
          <span className="text-tc-shell-accent">Waste less.</span>
        </h1>

        <p className="tc-landing-fade-up tc-landing-delay-2 mx-auto mb-10 mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600 sm:text-xl">
          The simplest way to exchange items with people near you. No feeds. No clutter. Just things moving forward.
        </p>

        <div className="tc-landing-fade-up tc-landing-delay-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-8 py-3.5 text-base font-semibold text-tc-shell-roleActiveText no-underline shadow-[0_18px_40px_rgba(164,245,166,0.32)] transition duration-200 hover:-translate-y-0.5 hover:bg-tc-action-primaryHover"
            to={ctaTo}
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-900/10 bg-white/45 px-8 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-white/80"
            href="#how"
          >
            See how it works
          </a>
        </div>

        {!isAuthenticated ? (
          <div className="tc-landing-fade-up tc-landing-delay-4 mt-4 flex justify-center">
            <Link className="text-sm font-medium text-slate-600 no-underline transition-colors hover:text-slate-950" to="/login">
              Already have an account? Log in
            </Link>
          </div>
        ) : null}

        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {statPills.map((stat, index) => (
            <div
              key={stat.value}
              className={`tc-landing-card flex items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/80 px-5 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
            >
              <span className="text-2xl font-bold tracking-[-0.04em] text-tc-shell-bg">{stat.value}</span>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}