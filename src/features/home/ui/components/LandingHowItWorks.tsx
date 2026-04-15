import { ArrowDown, HandshakeIcon, Radar, Upload } from 'lucide-react'

const steps = [
  {
    colorClassName: 'bg-tc-shell-accent/20 text-tc-shell-bg',
    description: 'Snap a photo, pick a category, and your item is live in seconds.',
    icon: Upload,
    number: '01',
    title: 'List it',
  },
  {
    colorClassName: 'bg-tc-shell-bg/10 text-tc-shell-bg',
    description: 'People nearby see what\'s available first, so exchange stays truly local.',
    icon: Radar,
    number: '02',
    title: 'Get matched',
  },
  {
    colorClassName: 'bg-tc-app-canvas text-tc-shell-bg',
    description: 'Agree on a time, exchange the item, and let status updates keep things clear.',
    icon: HandshakeIcon,
    number: '03',
    title: 'Hand it off',
  },
] as const

export function LandingHowItWorks() {
  return (
    <section className="px-6 py-24" id="how">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <span className="tc-landing-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-tc-shell-bg">
            How it works
          </span>
          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Three steps.
            <br />
            Zero friction.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div className="group relative" key={step.number}>
              <div
                className={`tc-landing-card flex h-full flex-col gap-5 rounded-[1.8rem] border border-white/70 bg-white/80 p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur ${index === 0 ? 'tc-landing-delay-1' : index === 1 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.colorClassName}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-5xl font-bold tracking-[-0.06em] text-slate-900/5">{step.number}</span>
                </div>

                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-950">{step.title}</h3>
                <p className="text-base leading-7 text-slate-600">{step.description}</p>
              </div>

              {index < steps.length - 1 ? (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:flex">
                  <ArrowDown className="h-5 w-5 -rotate-90 text-slate-300" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}