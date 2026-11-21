import exchangeIcon from '@/assets/images/exchange-icon.png'

const dashboardRoles = [
  { role: 'Donor', description: 'List items, track interest, arrange handoffs.' },
  { role: 'Collector', description: 'Browse nearby listings, claim what you need.' },
] as const

export function LandingDashboardSection() {
  return (
    <section className="overflow-hidden bg-tc-brand-haze px-4 py-6 text-white sm:px-6">
      <div className="mx-auto grid max-w-[1184px] gap-12 rounded-tc-xl bg-tc-brand-deep px-6 py-12 sm:px-10 lg:grid-cols-2 lg:items-center lg:px-16 lg:py-[72px]">
        <div className="max-w-xl">
          <span className="tc-landing-fade-up text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-mint">
            Your dashboard
          </span>
          <h2 className="tc-landing-fade-up tc-landing-delay-1 mt-3 text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-white">
            Two sides.
            <br />
            One simple view.
          </h2>
          <p className="tc-landing-fade-up tc-landing-delay-2 mb-8 mt-[18px] text-base leading-[26px] text-tc-brand-onDeep">
            Whether you&apos;re giving or collecting, everything lives in one shared dashboard. No switching between apps. No confusion.
          </p>

          <div className="space-y-3.5">
            {dashboardRoles.map((entry, index) => (
              <div
                key={entry.role}
                className={`tc-landing-fade-up rounded-tc-lg border border-tc-brand-deepLine bg-tc-brand-hover p-[22px] ${index === 0 ? 'tc-landing-delay-2' : 'tc-landing-delay-3'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-tc-brand-mint" />
                  <div>
                    <p className="text-lg font-semibold leading-6 text-white">{entry.role}</p>
                    <p className="mt-1.5 text-[15px] leading-[22px] text-tc-brand-onDeep">{entry.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[22rem] items-center justify-center">
          <div className="animate-pulse-soft absolute h-64 w-64 rounded-full bg-tc-brand-mint/15" />
          <div className="absolute h-80 w-80 rounded-full border border-tc-brand-deepLine" />
          <img
            alt="Exchange illustration"
            className="animate-float relative z-10 h-56 w-56 object-contain drop-shadow-[0_30px_60px_rgba(10,13,10,0.35)] sm:h-72 sm:w-72"
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