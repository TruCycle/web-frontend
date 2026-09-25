import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'

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
    badge: 'Porch pickup',
    description: 'Chairs, side tables, shelves, lamps.',
    Icon: Armchair,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop',
    title: 'Furniture',
    categoryQuery: 'Furniture',
  },
  {
    badge: 'Clean + ready',
    description: 'Mugs, pans, small appliances, jars.',
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
    badge: 'Check sizes',
    description: 'Toys, carriers, clothes, nursery extras.',
    Icon: Baby,
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&fit=crop',
    title: 'Kids + baby',
    categoryQuery: 'Kids + baby',
  },
  {
    badge: 'Outdoor pickup',
    description: 'Planters, hand tools, hardware, timber.',
    Icon: Wrench,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&fit=crop',
    title: 'Garden + tools',
    categoryQuery: 'Garden + tools',
  },
  {
    badge: 'Power checked',
    description: 'Cables, speakers, monitors, chargers.',
    Icon: MonitorSmartphone,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fit=crop',
    title: 'Tech shelf',
    categoryQuery: 'Electronics',
  },
] as const

export function LandingWhatWeTakeSection() {
  return (
    <section className="bg-[#F7FBF4] px-6 py-20 sm:py-24" id="what-we-take">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div className="max-w-[28.75rem]">
            <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
              What finds a home
            </p>
            <h2 className="mt-5 text-[clamp(2.45rem,4.9vw,3.5rem)] font-normal leading-[0.98] tracking-[-0.05em] text-[#0B3322]">
              <span className="block">Useful pieces, waiting</span>
              <span className="block">for another home.</span>
            </h2>
            <p className="mt-6 max-w-[28rem] text-base leading-8 text-[#121212B3]">
              A small catalog keeps offers specific: show the object, choose a
              category, and add the pickup detail that makes saying yes easy.
            </p>
          </div>

          <aside className="rounded-[1rem] bg-[#113A29] px-6 py-5 text-white shadow-[0_24px_60px_rgba(11,51,34,0.16)] sm:px-7">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold tracking-[0.04em] text-[#8EEA93]">
                  List with light
                </p>
                <p className="mt-2 max-w-[18rem] text-base leading-8 text-white">
                  Natural-light photos help neighbours judge size and condition.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.04em] text-[#8EEA93]">
                  Keep it practical
                </p>
                <p className="mt-2 max-w-[18rem] text-base leading-8 text-white">
                  No sales, no holds, no mystery bags. Clear handoffs only.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-[1.125rem] md:grid-cols-2 xl:grid-cols-3">
          {categories.map(({ Icon, badge, description, imageUrl, title, categoryQuery }) => (
            <Link
              to={`/browse?category=${encodeURIComponent(categoryQuery)}`}
              className="group flex flex-col overflow-hidden rounded-[1.15rem] border border-[#CBD5E1] bg-white no-underline shadow-[0_18px_48px_rgba(11,51,34,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#0B3322]/40 hover:shadow-[0_20px_50px_rgba(11,51,34,0.12)]"
              key={title}
            >
              <div
                className="relative h-36 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                <div className="absolute inset-0 bg-[#0B3322]/55 transition-colors group-hover:bg-[#0B3322]/45" />
                <div className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-sm font-bold tracking-[0.04em] text-white backdrop-blur-sm">
                  {badge}
                </div>
                <div className="absolute inset-y-0 right-5 flex items-center">
                  <Icon className="h-10 w-10 text-white/90 transition-transform group-hover:scale-110" />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between space-y-3 p-5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[1.45rem] font-normal leading-none tracking-[-0.04em] text-[#0B3322] group-hover:text-[#0D3B24]">
                      {title}
                    </h3>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#0B3322] group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-base leading-7 text-[#121212B3]">{description}</p>
                </div>
                <span className="text-xs font-bold text-[#0B3322] opacity-0 transition-opacity group-hover:opacity-100">
                  Explore {title} listings →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm font-semibold tracking-[0.04em] text-[#121212B3]">
          <span className="h-px w-10 bg-[#D7E3D5]" />
          <span>
            Small categories make browsing feel like a neighbour&apos;s shelf, not a
            marketplace.
          </span>
        </div>
      </div>
    </section>
  )
}