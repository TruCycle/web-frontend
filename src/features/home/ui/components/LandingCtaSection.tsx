import { Link } from 'react-router-dom'

type LandingCtaSectionProps = {
  readonly browseTo: string
  readonly postItemTo: string
}

export function LandingCtaSection({ browseTo, postItemTo }: LandingCtaSectionProps) {
  return (
    <section className="bg-[#F7FBF4] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#0B33221A] bg-tc-shell-accent px-6 py-14 shadow-[0_28px_70px_rgba(11,51,34,0.10)] sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h2 className="max-w-3xl text-[clamp(2.4rem,5vw,3.35rem)] font-normal leading-[1.02] tracking-[-0.05em] text-[#0B3322]">
              Got something to rehome?
            </h2>
            <p className="max-w-[35rem] text-base leading-7 text-[#0B3322]/80 sm:text-[1.05rem] sm:leading-8">
              Two minutes. One photo. A neighbour gets what they needed, and the
              skip stays empty.
            </p>

            <div className="my-1 h-px w-14 bg-[#0B332233]" />

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-[#0B3322] px-6 py-3 text-sm font-extrabold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to={postItemTo}
              >
                Post your first item -&gt;
              </Link>
              <Link
                className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-[#8EEA93] px-6 py-3 text-sm font-extrabold text-[#0B3322] no-underline transition-transform duration-200 hover:-translate-y-0.5"
                to={browseTo}
              >
                Or browse what&apos;s local
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}