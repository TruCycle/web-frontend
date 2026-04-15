import { Eye, MapPin, VolumeX, Zap } from 'lucide-react'

const features = [
  {
    description: 'Every item has a status: active, claimed, or done. No guessing.',
    icon: Eye,
    title: 'Always clear',
  },
  {
    description: 'Nearby items surface first so exchange stays walkable and realistic.',
    icon: MapPin,
    title: 'Hyper-local',
  },
  {
    description: 'No social feeds, no likes, no algorithms. Just exchange.',
    icon: VolumeX,
    title: 'No noise',
  },
  {
    description: 'Repeat exchangers move fast, so the interface stays out of the way.',
    icon: Zap,
    title: 'Built for speed',
  },
] as const

export function LandingWhyItWorks() {
  return (
    <section className="bg-tc-app-canvas px-6 py-24" id="why">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="tc-landing-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-tc-shell-bg">
            Why TruCycle
          </span>
          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Exchange should be effortless.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              className={`tc-landing-card rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-none ring-1 ring-slate-100/80 backdrop-blur transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : index === 2 ? 'tc-landing-delay-3' : 'tc-landing-delay-4'}`}
              key={feature.title}
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-tc-shell-accent/20 text-tc-shell-bg">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-[-0.02em] text-slate-950">{feature.title}</h3>
              <p className="text-sm leading-7 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}