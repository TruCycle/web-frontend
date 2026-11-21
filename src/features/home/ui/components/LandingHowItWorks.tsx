import { Leaf } from 'lucide-react'

const heroImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&fit=crop'

const steps = [
  {
    badge: 'Clear details',
    description: 'Post a clear photo and one honest note about condition.',
    number: '01',
    title: 'Offer',
  },
  {
    badge: 'Agree together',
    description: 'Choose a nearby neighbour and agree a simple pickup window.',
    number: '02',
    title: 'Match',
  },
  {
    badge: 'Agreed collection',
    description: 'Agree a suitable place and time, then pass the item on.',
    number: '03',
    title: 'Handoff',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section className="bg-tc-brand-haze px-4 py-20 sm:px-6 sm:py-[88px]" id="how">
      <div className="mx-auto grid max-w-[1184px] gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-12">
        <div className="flex max-w-[22.5rem] flex-col justify-center">
          <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
            The local loop
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
            <span className="block">Clear a shelf,</span>
            <span className="block">pass it on</span>
            <span className="block">next door.</span>
          </h2>
          <p className="mt-4 text-base leading-[26px] text-tc-brand-body">
            TruCycle turns the middle of a move, a tidy-up, or a finished project
            into a calm handoff between neighbours.
          </p>

          <div className="mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-full border border-tc-brand-line bg-white px-4 text-sm font-semibold text-tc-brand-ink">
            <Leaf className="h-4 w-4 text-tc-brand-deep" />
            Ready for a second use
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-64 overflow-hidden rounded-tc-xl bg-tc-brand-soft md:min-h-[420px]">
            <img
              alt="Illustrative home interior"
              className="h-64 w-full object-cover md:absolute md:inset-0 md:h-full"
              loading="lazy"
              src={heroImg}
            />
            <div className="absolute inset-x-4 bottom-4 rounded-tc-md bg-tc-brand-deep/[.88] px-4 py-3.5 text-sm font-normal leading-5 text-white">
              Objects stay useful when the handoff is close, specific, and easy.
            </div>
          </div>

          <div className="grid gap-3.5">
            {steps.map((step) => (
              <article
                className="grid h-full grid-cols-[44px_minmax(0,1fr)] content-center gap-x-4 gap-y-1 rounded-tc-lg border border-tc-brand-line bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-tc-card"
                key={step.number}
              >
                <p className="row-span-3 flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft text-[15px] font-semibold text-tc-brand-ink">
                  {step.number}
                </p>
                <h3 className="text-lg font-semibold leading-6 text-tc-brand-ink">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[22px] text-tc-brand-body">{step.description}</p>
                <div className="mt-1 inline-flex w-fit rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-body">
                  {step.badge}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}