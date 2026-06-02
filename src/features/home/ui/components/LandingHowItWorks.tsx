import { Leaf } from 'lucide-react'

const heroImg = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&fit=crop'

const steps = [
  {
    badge: '2 min list',
    description: 'Post a clear photo and one honest note about condition.',
    number: '01',
    title: 'Offer',
  },
  {
    badge: 'Local only',
    description: 'Choose a nearby neighbour and agree a simple pickup window.',
    number: '02',
    title: 'Match',
  },
  {
    badge: 'Zero waste',
    description: 'Leave it on the porch, meet at the lobby, or pass it on in person.',
    number: '03',
    title: 'Handoff',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section className="bg-[#F3F8F4] px-6 py-20 sm:py-24" id="how">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-9">
        <div className="flex max-w-[19.5rem] flex-col justify-center">
          <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
            The local loop
          </p>
          <h2 className="mt-5 text-[clamp(2.6rem,4.7vw,3.6rem)] font-light leading-[0.95] tracking-[-0.05em] text-[#0B3322]">
            <span className="block">Clear a shelf,</span>
            <span className="block">pass it on</span>
            <span className="block">next door.</span>
          </h2>
          <p className="mt-6 text-[1.05rem] leading-8 text-[#121212B3]">
            TruCycle turns the middle of a move, a tidy-up, or a finished project
            into a calm handoff between neighbours.
          </p>

          <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-semibold tracking-[0.04em] text-[#0B3322]">
            <Leaf className="h-4 w-4 text-[#172033]" />
            Ready for a second use
          </div>
        </div>

        <div className="space-y-[1.125rem]">
          <div className="relative overflow-hidden rounded-[1rem] shadow-[0_18px_54px_rgba(11,51,34,0.08)]">
            <img
              alt="Items arranged and ready to pass on"
              className="h-56 w-full object-cover"
              loading="lazy"
              src={heroImg}
            />
            <div className="absolute inset-x-0 bottom-0 bg-[#0B3322B8] px-5 py-4 text-base font-semibold text-white">
              Objects stay useful when the handoff is close, specific, and easy.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step) => (
              <article
                className="flex h-full flex-col gap-3 rounded-[1rem] border border-[#CBD5E1] bg-white p-4 shadow-[0_14px_38px_rgba(11,51,34,0.05)]"
                key={step.number}
              >
                <p className="text-base font-medium tracking-[0.04em] text-[#172033]">
                  {step.number}
                </p>
                <h3 className="text-[1.45rem] font-light leading-none tracking-[-0.04em] text-[#0B3322]">
                  {step.title}
                </h3>
                <p className="text-base leading-8 text-[#121212B3]">{step.description}</p>
                <div className="mt-auto inline-flex w-fit rounded-md bg-[#F3F8F4] px-3 py-1.5 text-sm font-bold tracking-[0.04em] text-[#172033]">
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