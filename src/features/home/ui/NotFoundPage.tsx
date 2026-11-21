import { Link } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta({
    title: 'Page Not Found — TruCycle',
    description: 'The page you are looking for does not exist or has been moved.',
    noIndex: true,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-tc-brand-haze px-6 py-16 text-center text-tc-brand-ink">
      <p className="rounded-full border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 py-1.5 text-sm font-semibold leading-5 text-tc-brand-ink">404</p>

      <h1 className="mt-3.5 text-[clamp(2.25rem,6vw,3rem)] font-semibold leading-[1.125] tracking-[-0.03em] text-tc-brand-ink">
        Page not found
      </h1>

      <p className="mt-3.5 max-w-[460px] text-base leading-[26px] text-tc-brand-body">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
        moved. Let&apos;s get you back on track.
      </p>

      <div className="mt-[22px] flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full bg-tc-brand-deep px-5 text-sm font-semibold text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-tc-brand-hover"
          to="/"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
