import { Link } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta({
    title: 'Page Not Found — TruCycle',
    description: 'The page you are looking for does not exist or has been moved.',
    noIndex: true,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7FBF4] px-6 text-center">
      <p className="text-sm font-bold tracking-[0.04em] text-[#172033]">404</p>

      <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-normal leading-[1] tracking-[-0.05em] text-[#0B3322]">
        Page not found
      </h1>

      <p className="mt-6 max-w-md text-base leading-8 text-[#121212B3]">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
        moved. Let&apos;s get you back on track.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center rounded-full bg-[#0B3322] px-6 py-3 text-base font-bold text-white no-underline shadow-[0_18px_40px_rgba(11,51,34,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
          to="/"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
