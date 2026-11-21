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
    <section className="bg-tc-brand-haze px-4 py-20 sm:px-6" id="why">
      <div className="mx-auto max-w-[1184px]">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="tc-landing-fade-up text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
            Why TruCycle
          </span>
          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
            Exchange should be effortless.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              className={`tc-landing-card rounded-tc-lg border border-tc-brand-line bg-white p-7 shadow-none transition-shadow duration-300 hover:shadow-tc-card ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : index === 2 ? 'tc-landing-delay-3' : 'tc-landing-delay-4'}`}
              key={feature.title}
            >
              <div className="mb-[18px] flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-xl font-semibold leading-7 text-tc-brand-ink">{feature.title}</h3>
              <p className="text-[15px] leading-6 text-tc-brand-body">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}