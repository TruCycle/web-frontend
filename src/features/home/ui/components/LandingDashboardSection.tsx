import exchangeIcon from '@/assets/images/exchange-icon.png'

const dashboardRoles = [
  { role: 'Donor', description: 'List items, track interest, arrange handoffs.' },
  { role: 'Collector', description: 'Browse nearby listings, claim what you need.' },
] as const

export function LandingDashboardSection() {
  return (
    <section className="overflow-hidden bg-tc-shell-bg px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
        <div className="max-w-xl">
          <span className="tc-landing-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-tc-shell-accent">
            Your dashboard
          </span>
          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
            Two sides.
            <br />
            One simple view.
          </h2>
          <p className="tc-landing-fade-up tc-landing-delay-2 mb-10 mt-6 text-lg leading-8 text-white/70">
            Whether you&apos;re giving or collecting, everything lives in one shared dashboard. No switching between apps. No confusion.
          </p>

          <div className="space-y-4">
            {dashboardRoles.map((entry, index) => (
              <div
                key={entry.role}
                className={`tc-landing-card rounded-[1.35rem] border border-white/5 bg-[#24332c] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${index === 0 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2f9d7e]" />
                  <div>
                    <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-white">{entry.role}</p>
                    <p className="mt-2 text-[0.95rem] leading-7 text-[#9fb1ab]">{entry.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[22rem] items-center justify-center">
          <div className="animate-pulse-soft absolute h-64 w-64 rounded-full bg-tc-shell-accent/12" />
          <div className="absolute h-80 w-80 rounded-full border border-white/10" />
          <img
            alt="Exchange illustration"
            className="animate-float relative z-10 h-56 w-56 object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)] sm:h-72 sm:w-72"
            height={512}
            loading="lazy"
            src={exchangeIcon}
            width={512}
          />
        </div>
      </div>
    </section>
  )
}