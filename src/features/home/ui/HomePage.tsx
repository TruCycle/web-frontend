import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="m-0 text-2xl font-bold text-slate-900">Project scaffold is ready</h1>
      <p className="mt-3 text-slate-600">
        This starter follows the feature-first architecture in `AGENTS.md` with
        strict TypeScript, route lazy-loading, and shared plumbing.
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <Link className="font-semibold text-tc-auth-link no-underline hover:underline" to="/messages">
          Open messaging scaffold
        </Link>
        <Link className="font-semibold text-tc-auth-link no-underline hover:underline" to="/notifications">
          Open notifications scaffold
        </Link>
        <Link className="font-semibold text-tc-auth-link no-underline hover:underline" to="/dashboard">
          Open dashboard
        </Link>
      </div>
    </section>
  )
}
