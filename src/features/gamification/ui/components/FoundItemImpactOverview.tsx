import { Sparkles } from 'lucide-react'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import type { FoundItemImpactSummary } from '../../types'

interface FoundItemImpactOverviewProps {
  readonly summary: FoundItemImpactSummary | null
  readonly isLoading: boolean
  readonly error: string | null
}

function StatusPill({ status }: { readonly status: FoundItemImpactSummary['recentPosts'][number]['status'] }) {
  const toneClassName =
    status === 'available'
      ? 'bg-[#E9FCE8] text-[#166534]'
      : status === 'claimed'
      ? 'bg-[#FFF4D9] text-[#D97706]'
      : status === 'picked_up'
      ? 'bg-[#F1F5F9] text-slate-600'
      : status === 'reported'
      ? 'bg-[#FEF2F2] text-[#DC2626]'
      : 'bg-[#FFF7ED] text-[#C2410C]'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${toneClassName}`}>
      {status === 'available' ? 'live' : status.replace('_', ' ')}
    </span>
  )
}

export function FoundItemImpactOverview({
  summary,
  isLoading,
  error,
}: FoundItemImpactOverviewProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Found item impact</h2>
          <p className="text-sm text-slate-500">What your curb alerts are adding to the board.</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF7E3] text-[#55741D]">
          <Sparkles size={20} />
        </span>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading found-item impact...</p> : null}

      {!isLoading && !error && summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Spots posted</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{summary.spotsPosted}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Tracked CO2e</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{summary.totalCo2eKg} kg</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Impact score</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{summary.totalImpactPoints}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Current area rank</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {summary.currentMonthAreaRank ? `#${summary.currentMonthAreaRank}` : '—'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Board footprint</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">{summary.liveSpots}</span> live spots currently on the board.
                </p>
                <p>
                  <span className="font-semibold text-slate-900">{summary.rescuedSpots}</span> rescued spots and{' '}
                  <span className="font-semibold text-slate-900">{summary.reportedSpots}</span> reported posts.
                </p>
                <p>
                  Strongest posting area:{' '}
                  <span className="font-semibold text-slate-900">{summary.topArea ?? 'Not enough data yet'}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recent found-item posts</h3>
              <div className="mt-4 space-y-3">
                {summary.recentPosts.length > 0 ? (
                  summary.recentPosts.map((post) => (
                    <div key={post.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{post.title}</p>
                          <p className="text-sm text-slate-500">
                            {post.postcode} · {formatRelativeTime(post.postedAt)}
                          </p>
                        </div>
                        <StatusPill status={post.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-[#55741D]">{post.estimatedCo2eKg} kg CO2e</span>
                        <span className="text-slate-500">{post.impactPoints} pts</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Post your first found item to start your local impact history.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}