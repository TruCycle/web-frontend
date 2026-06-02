import type { ComponentType, SVGProps } from 'react'

import {
  Armchair,
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
}

const categories: readonly Category[] = [
  {
    badge: 'Porch pickup',
    description: 'Chairs, side tables, shelves, lamps.',
    Icon: Armchair,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop',
    title: 'Furniture',
  },
  {
    badge: 'Clean + ready',
    description: 'Mugs, pans, small appliances, jars.',
    Icon: CookingPot,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop',
    title: 'Kitchenware',
  },
  {
    badge: 'Bundle friendly',
    description: 'Books, records, games, art supplies.',
    Icon: BookOpen,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80&fit=crop',
    title: 'Books + media',
  },
  {
    badge: 'Check sizes',
    description: 'Toys, carriers, clothes, nursery extras.',
    Icon: Baby,
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&fit=crop',
    title: 'Kids + baby',
  },
  {
    badge: 'Outdoor pickup',
    description: 'Planters, hand tools, hardware, timber.',
    Icon: Wrench,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&fit=crop',
    title: 'Garden + tools',
  },
  {
    badge: 'Power checked',
    description: 'Cables, speakers, monitors, chargers.',
    Icon: MonitorSmartphone,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fit=crop',
    title: 'Tech shelf',
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
          {categories.map(({ Icon, badge, description, imageUrl, title }) => (
            <article
              className="overflow-hidden rounded-[1.15rem] border border-[#CBD5E1] bg-white shadow-[0_18px_48px_rgba(11,51,34,0.06)]"
              key={title}
            >
              <div
                className="relative h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                <div className="absolute inset-0 bg-[#0B3322]/55" />
                <div className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-sm font-bold tracking-[0.04em] text-white backdrop-blur-sm">
                  {badge}
                </div>
                <div className="absolute inset-y-0 right-5 flex items-center">
                  <Icon className="h-10 w-10 text-white/90" />
                </div>
              </div>

              <div className="space-y-3 p-5">
                <h3 className="text-[1.45rem] font-normal leading-none tracking-[-0.04em] text-[#0B3322]">
                  {title}
                </h3>
                <p className="text-base leading-8 text-[#121212B3]">{description}</p>
              </div>
            </article>
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