import { Star } from 'lucide-react'

type Testimonial = {
  readonly initials: string
  readonly name: string
  readonly quote: string
  readonly role: string
}

const testimonials: readonly Testimonial[] = [
  {
    initials: 'MK',
    name: 'Mira K.',
    quote:
      'We were moving and the council quoted £240 for the sofa. Listed it Saturday - a young couple two streets away picked it up Sunday morning.',
    role: 'Hackney · giver',
  },
  {
    initials: 'JL',
    name: 'Jordan L.',
    quote:
      'First flat. Furnished the lounge for nothing - a desk from Tooting, a bookcase from Brixton, a rug from Peckham. Met some nice people on the way.',
    role: 'Lambeth · taker',
  },
  {
    initials: 'SA',
    name: 'Sam & Amara',
    quote:
      "We've used it three times in our refurb. Better than putting a bookshelf in a skip - and someone always wants it.",
    role: 'Walthamstow · givers',
  },
] as const

export function LandingTestimonialsSection() {
  return (
    <section className="bg-[#F7FBF4] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
            Neighbours, not strangers
          </p>
          <h2 className="text-[clamp(2.35rem,4.4vw,3.2rem)] font-normal leading-[1.08] tracking-[-0.05em] text-[#0B3322]">
            <span className="text-[#0B3322]">Real people,</span>{' '}
            <span className="text-[#172033]">real handovers.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              className="rounded-[1.15rem] border border-[#CBD5E1] bg-white p-6 shadow-[0_18px_48px_rgba(11,51,34,0.06)]"
              key={testimonial.name}
            >
              <div className="flex items-center gap-1 text-[#081D14]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star className="h-4 w-4 fill-current" key={index} />
                ))}
              </div>

              <p className="mt-8 min-h-[9.25rem] text-[1.02rem] leading-8 text-[#0B3322]">
                {testimonial.quote}
              </p>

              <div className="mt-6 border-t border-[#CBD5E1] pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5F8EC] text-sm font-extrabold text-[#172033]">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold tracking-[0.04em] text-[#0B3322]">
                      {testimonial.name}
                    </p>
                    <p className="mt-1 text-sm text-[#121212B3]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}