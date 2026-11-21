import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { ReuseSafetyNotice } from '@/shared/ui/reuse/ReuseSafetyNotice'

import {
  Armchair,
  ArrowUpRight,
  Baby,
  BookOpen,
  CookingPot,
  MonitorSmartphone,
  Wrench,
} from 'lucide-react'

type Category = {
  readonly badge: string
  readonly description: string
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>
  readonly imageUrl: string
  readonly title: string
  readonly categoryQuery: string
}

const categories: readonly Category[] = [
  {
    badge: 'Check condition',
    description: 'Sound tables, shelves and chairs. Upholstered items need their permanent fire-safety label.',
    Icon: Armchair,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop',
    title: 'Furniture',
    categoryQuery: 'Furniture',
  },
  {
    badge: 'Clean + ready',
    description: 'Clean cookware and household items that are safe for their original use.',
    Icon: CookingPot,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop',
    title: 'Kitchenware',
    categoryQuery: 'Kitchenware',
  },
  {
    badge: 'Bundle friendly',
    description: 'Books, records, games, art supplies.',
    Icon: BookOpen,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80&fit=crop',
    title: 'Books + media',
    categoryQuery: 'Books',
  },
  {
    badge: 'Check safety',
    description: 'Complete, safe and non-recalled toys and children’s items. No child car seats.',
    Icon: Baby,
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&fit=crop',
    title: 'Kids + baby',
    categoryQuery: 'Kids + baby',
  },
  {
    badge: 'Complete + safe',
    description: 'Sound garden furniture and complete hand tools. Describe condition clearly.',
    Icon: Wrench,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&fit=crop',
    title: 'Garden + tools',
    categoryQuery: 'Garden + tools',
  },
  {
    badge: 'Working + safe',
    description: 'Working electrical items with intact plugs, cables and casings. Check for recalls.',
    Icon: MonitorSmartphone,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fit=crop',
    title: 'Tech shelf',
    categoryQuery: 'Electronics',
  },
] as const

export function LandingWhatWeTakeSection() {
  return (
    <section className="border-y border-tc-brand-line bg-white px-4 py-20 sm:px-6 sm:py-[88px]" id="what-we-take">
      <div className="mx-auto max-w-[1184px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,560px)] lg:items-end lg:justify-between lg:gap-10">
          <div className="max-w-[520px]">
            <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
              Ideas for things to offer
            </p>
            <h2 className="mt-3.5 text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
              <span className="block">Useful pieces, ready</span>
              <span className="block">for another home.</span>
            </h2>
            <p className="mt-3.5 max-w-[520px] text-base leading-[26px] text-tc-brand-body">
              These categories are examples, not current listings. Show the object, choose a
              category, and add the pickup detail that makes saying yes easy.
            </p>
          </div>

          <aside className="text-tc-brand-ink">
            <div className="grid gap-3.5 sm:grid-cols-2 [&>div]:rounded-tc-lg [&>div]:border [&>div]:border-tc-brand-mintLine [&>div]:bg-tc-brand-mintSoft [&>div]:p-[18px]">
              <div>
                <p className="text-[15px] font-semibold leading-[22px] text-tc-brand-ink">
                  List with light
                </p>
                <p className="mt-1 text-sm leading-5 text-tc-brand-body">
                  Natural-light photos help neighbours judge size and condition.
                </p>
              </div>
              <div>
                <p className="text-[15px] font-semibold leading-[22px] text-tc-brand-ink">
                  Keep it practical
                </p>
                <p className="mt-1 text-sm leading-5 text-tc-brand-body">
                  Describe what is included and agree collection details directly.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map(({ Icon, badge, description, imageUrl, title, categoryQuery }) => (
            <Link
              to={`/browse?category=${encodeURIComponent(categoryQuery)}`}
              className="group flex flex-col overflow-hidden rounded-tc-lg border border-tc-brand-line bg-tc-brand-haze text-tc-brand-ink no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-tc-card"
              key={title}
            >
              <div
                className="relative h-[190px] bg-tc-brand-soft bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                <div className="absolute inset-0 bg-tc-brand-deep/0 transition-colors group-hover:bg-tc-brand-deep/10" />
                <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-[5px] text-xs font-semibold leading-4 text-tc-brand-ink">
                  {badge}
                </div>
                <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-tc-brand-deep">
                  <Icon className="h-[18px] w-[18px] text-tc-brand-deep transition-transform group-hover:scale-110" />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between space-y-3 p-[18px]">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold leading-6 text-tc-brand-ink">
                      {title}
                    </h3>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep transition-colors group-hover:bg-tc-brand-deep group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-[22px] text-tc-brand-body">{description}</p>
                </div>
                <span className="text-xs font-semibold leading-4 text-tc-brand-deep opacity-0 transition-opacity group-hover:opacity-100">
                  Explore {title} listings →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8"><ReuseSafetyNotice /></div>

        <div className="mt-6 flex items-center gap-3 text-[13px] font-medium leading-5 text-tc-brand-muted">
          <span className="h-px w-10 bg-tc-brand-line" />
          <span>
            Small categories make browsing feel like a neighbour&apos;s shelf, not a
            marketplace.
          </span>
        </div>
      </div>
    </section>
  )
}
