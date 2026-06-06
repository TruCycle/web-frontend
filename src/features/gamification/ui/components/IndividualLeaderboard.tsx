import { Sparkles } from 'lucide-react'
import { useIndividualLeaderboard } from '../../hooks/useIndividualLeaderboard'
import { getInitials } from '../communityBoardData'

const tierColor: Record<string, string> = {
  Seedling: 'bg-tc-app-canvas text-tc-app-secondary',
  Sprout: 'bg-[#ECFBEA] text-tc-app-text',
  Sapling: 'bg-[#DFF7DD] text-tc-app-text',
  Grove: 'bg-[#CFF3CD] text-tc-app-text',
  Forest: 'bg-[#BCEFB8] text-tc-app-text',
  Canopy: 'bg-tc-app-primary text-tc-app-text',
}

export function IndividualLeaderboard() {
  const { board, isLoading, error } = useIndividualLeaderboard(25)

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Top spotters worldwide</h2>
          <p className="text-sm text-slate-500">Lifetime points across the whole TruCycle community</p>
        </div>
      </div>

      {board?.currentUser ? (
        <div className="mb-4 rounded-2xl bg-[linear-gradient(135deg,rgba(164,245,166,0.20)_0%,rgba(248,250,252,1)_100%)] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tc-app-text">Your rank</p>
              <p className="mt-2 text-sm text-slate-600">
                Global #{board.currentUser.rank.toLocaleString()} · {board.currentUser.tier}
              </p>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-tc-app-primary/18 text-tc-app-text shadow-sm">
              <Sparkles size={18} />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {board.currentUser.totalPoints.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">lifetime pts</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">L{board.currentUser.currentLevel}</p>
              <p className="text-sm text-slate-500">level</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        {isLoading ? <p className="px-4 py-4 text-sm text-slate-500">Loading rankings...</p> : null}
        {error ? <p className="px-4 py-4 text-sm text-rose-600">{error}</p> : null}
        {!isLoading && !error && board && board.entries.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-500">No-one is on the leaderboard yet — post a spot to be the first!</p>
        ) : null}
        {!isLoading && !error && board
          ? board.entries.map((entry) => {
              const tierClass = tierColor[entry.tier] ?? 'bg-slate-100 text-slate-700'
              return (
                <div
                  key={entry.userId}
                  className={
                    entry.isCurrentUser
                      ? 'flex items-center gap-3 rounded-2xl bg-tc-app-primary/15 px-4 py-4'
                      : 'flex items-center gap-3 rounded-2xl px-4 py-4 transition hover:bg-slate-50'
                  }
                >
                  <span className="w-9 text-sm font-semibold text-slate-500">#{entry.rank}</span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tc-app-primary/20 text-sm font-semibold text-tc-app-text">
                    {getInitials(entry.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{entry.name}</p>
                      {entry.isCurrentUser ? (
                        <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-tc-auth-link">You</span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${tierClass}`}>
                        {entry.tier}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Level {entry.currentLevel}
                      {entry.postcode ? ` · ${entry.postcode}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-slate-900">
                      {entry.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">pts</p>
                  </div>
                </div>
              )
            })
          : null}
      </div>
    </section>
  )
}
