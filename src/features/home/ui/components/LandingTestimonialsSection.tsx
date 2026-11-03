const examples = [
  { title: 'Making space', description: 'A chair or shelf you no longer use could suit another home. Show its condition and dimensions in your offer.' },
  { title: 'Setting up a home', description: 'Browse offers for something you can use. Check availability and agree collection before travelling.' },
  { title: 'Finishing a project', description: 'Have useful materials left over? Describe what is included so another person can decide whether it fits their plans.' },
] as const

export function LandingTestimonialsSection() {
  return (
    <section className="bg-[#F7FBF4] px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">
            Ideas for reuse
          </p>
          <h2 className="text-[clamp(2.35rem,4.4vw,3.2rem)] font-normal leading-[1.08] tracking-[-0.05em] text-[#0B3322]">
            <span className="text-[#0B3322]">Useful things,</span>{' '}
            <span className="text-[#172033]">another home.</span>
          </h2>
          <p className="text-base text-[#121212B3]">Illustrative scenarios, not customer testimonials.</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {examples.map((example) => (
            <article
              className="rounded-[1.15rem] border border-[#CBD5E1] bg-white p-6 shadow-[0_18px_48px_rgba(11,51,34,0.06)]"
              key={example.title}
            >
              <h3 className="text-xl font-semibold text-[#0B3322]">{example.title}</h3>
              <p className="mt-6 text-[1.02rem] leading-8 text-[#0B3322]">{example.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}