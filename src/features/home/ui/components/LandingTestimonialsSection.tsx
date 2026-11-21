const examples = [
  { title: 'Making space', description: 'A chair or shelf you no longer use could suit another home. Show its condition and dimensions in your offer.' },
  { title: 'Setting up a home', description: 'Browse offers for something you can use. Check availability and agree collection before travelling.' },
  { title: 'Finishing a project', description: 'Have useful materials left over? Describe what is included so another person can decide whether it fits their plans.' },
] as const

export function LandingTestimonialsSection() {
  return (
    <section className="bg-tc-brand-haze px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1184px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
            Ideas for reuse
          </p>
          <h2 className="text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
            <span className="text-tc-brand-ink">Useful things,</span>{' '}
            <span className="text-tc-brand-ink">another home.</span>
          </h2>
          <p className="text-xs leading-4 text-tc-brand-muted">Illustrative scenarios, not customer testimonials.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {examples.map((example) => (
            <article
              className="rounded-tc-lg border border-tc-brand-line bg-white p-7 transition duration-200 hover:-translate-y-0.5 hover:shadow-tc-card"
              key={example.title}
            >
              <h3 className="text-xl font-semibold leading-7 text-tc-brand-ink">{example.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-tc-brand-body">{example.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}