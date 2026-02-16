import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="page-card">
      <h1>Project scaffold is ready</h1>
      <p>
        This starter follows the feature-first architecture in `AGENTS.md` with
        strict TypeScript, route lazy-loading, and shared plumbing.
      </p>
      <div className="page-actions">
        <Link className="text-link" to="/messages">
          Open messaging scaffold
        </Link>
        <Link className="text-link" to="/notifications">
          Open notifications scaffold
        </Link>
      </div>
    </section>
  )
}
