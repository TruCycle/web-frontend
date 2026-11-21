import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

const heroImg1 = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80&fit=crop'
const heroImg2 = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80&fit=crop'
const heroImg3 = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop'

type LandingHeroProps = {
  readonly browseTo: string
  readonly postItemTo: string
}

const metrics = [
  { value: 'Offer', label: 'List a useful item' },
  { value: 'Match', label: 'Agree a collection' },
  { value: 'Handoff', label: 'Pass it on' },
] as const

const popularCategories = [
  { label: '🛋️ Furniture', category: 'Furniture' },
  { label: '⚡ Tech', category: 'Electronics' },
  { label: '🍳 Kitchen', category: 'Kitchenware' },
  { label: '📚 Books', category: 'Books' },
] as const

export function LandingHero({ browseTo, postItemTo }: LandingHeroProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/browse?search=${encodeURIComponent(query)}` : '/browse')
  }
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:pt-[152px]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-tc-brand-haze" />
      <div className="absolute left-1/2 top-24 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-tc-brand-mintSoft blur-3xl" />

      <div className="mx-auto grid max-w-[1184px] gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-12">
        <div className="max-w-[34rem]">
          <p className="inline-flex min-h-8 w-fit items-center rounded-full border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 py-1 text-[13px] font-semibold leading-5 text-tc-brand-ink">
            Free neighbour-to-neighbour reuse
          </p>

          <h1 className="mt-[22px] text-[clamp(2.75rem,5.6vw,4.25rem)] font-semibold leading-[1.03] tracking-[-0.04em] text-tc-brand-ink">
            <span className="block">Your clutter is</span>
            <span className="block">someone&apos;s</span>
            <span className="block w-fit bg-[linear-gradient(transparent_62%,theme(colors.tc.brand.mint)_62%)] text-tc-brand-ink">treasure.</span>
          </h1>

          <div className="mt-[22px] max-w-[500px] text-base leading-[26px] text-tc-brand-body sm:text-lg sm:leading-7">
            <p>Offer useful things you no longer need, free to another neighbour.</p>
            <p>Browse offers and arrange collection directly with the person giving.</p>
          </div>

          {/* Instant Discovery Search Bar */}
          <form role="search" onSubmit={handleSearch} className="mt-[22px]">
            <label className="sr-only" htmlFor="landing-item-search">Search available items</label>
            <div className="relative flex h-[60px] items-center rounded-full border border-tc-brand-control bg-white pl-3 pr-2 shadow-[0_8px_24px_rgba(10,13,10,0.06)] transition focus-within:border-tc-brand-deep focus-within:ring-2 focus-within:ring-tc-brand-mint">
              <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-tc-brand-muted" />
              <input
                id="landing-item-search"
                type="search"
                maxLength={120}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sofas, desk, books, kitchen..."
                className="w-full min-w-0 bg-transparent px-3 py-2 text-base text-tc-brand-ink outline-none placeholder:text-tc-brand-muted"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep px-4 text-sm font-semibold text-white transition hover:bg-tc-brand-hover sm:px-[22px] sm:text-[15px]"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Popular Category Discovery Tags */}
          <div className="mt-[22px] flex flex-wrap items-center gap-2 text-[13px] leading-5 text-tc-brand-muted">
            <span className="text-tc-brand-muted">Popular:</span>
            {popularCategories.map((item) => (
              <Link
                key={item.category}
                to={`/browse?category=${encodeURIComponent(item.category)}`}
                className="inline-flex min-h-8 items-center rounded-full border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 font-medium text-tc-brand-ink no-underline transition hover:border-tc-brand-deep"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-[22px] flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 bg-tc-brand-deep text-white hover:bg-tc-brand-hover"
              to={postItemTo}
            >
              Post an item -&gt;
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 border border-tc-brand-control bg-transparent text-tc-brand-ink hover:bg-tc-brand-soft"
              to={browseTo}
            >
              Browse free items
            </Link>
          </div>

          <div className="mt-8 h-px w-full bg-tc-brand-line" />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div className="rounded-tc-lg border border-tc-brand-line bg-white px-4 py-3.5" key={metric.label}>
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">
                  {metric.value}
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-[22px] text-tc-brand-ink">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto grid h-[21rem] w-full max-w-[36rem] grid-cols-[1.25fr_1fr] grid-rows-2 gap-3.5 sm:h-[23.75rem] lg:max-w-none">
          <div className="row-span-2 overflow-hidden rounded-tc-xl bg-tc-brand-soft">
            <img
              alt="Illustrative furniture photo"
              className="h-full w-full object-cover"
              src={heroImg1}
              srcSet={`${heroImg1.replace('w=700', 'w=280')} 280w, ${heroImg1.replace('w=700', 'w=560')} 560w, ${heroImg1.replace('w=700', 'w=840')} 840w`}
              sizes="(min-width: 496px) 270px, calc((100vw - 48px) * 0.58)"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          <div className="overflow-hidden rounded-tc-xl bg-tc-brand-soft">
            <img
              alt="Illustrative books photo"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              src={heroImg2}
              srcSet={`${heroImg2.replace('w=600', 'w=220')} 220w, ${heroImg2.replace('w=600', 'w=440')} 440w, ${heroImg2.replace('w=600', 'w=660')} 660w`}
              sizes="(min-width: 496px) 214px, calc((100vw - 48px) * 0.46)"
            />
          </div>

          <div className="overflow-hidden rounded-tc-xl bg-tc-brand-soft">
            <img
              alt="Illustrative kitchenware photo"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              src={heroImg3}
              srcSet={`${heroImg3.replace('w=600', 'w=240')} 240w, ${heroImg3.replace('w=600', 'w=480')} 480w, ${heroImg3.replace('w=600', 'w=720')} 720w`}
              sizes="(min-width: 496px) 232px, calc((100vw - 48px) * 0.5)"
            />
          </div>

          <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-tc-brand-mint/25 blur-2xl" />
          <div className="absolute -right-2 -top-2 h-5 w-5 rounded-full border-4 border-tc-brand-haze bg-tc-brand-mint" />
          <div className="absolute -bottom-2 -left-2 h-5 w-5 rounded-full border-4 border-tc-brand-haze bg-tc-brand-mint" />
          <p className="absolute -bottom-8 inset-x-0 text-left text-xs leading-4 text-tc-brand-muted">Illustrative photos, not current listings.</p>
        </div>
      </div>
    </section>
  )
}
