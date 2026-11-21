import { Sparkles } from 'lucide-react'
import { useIndividualLeaderboard } from '../../hooks/useIndividualLeaderboard'
import { getInitials } from '../communityBoardData'

const tierColor: Record<string, string> = {
  Seedling: 'bg-tc-brand-soft text-tc-brand-body',
  Sprout: 'bg-tc-brand-soft text-tc-brand-body',
  Sapling: 'bg-tc-brand-soft text-tc-brand-body',
  Grove: 'bg-tc-brand-soft text-tc-brand-body',
  Forest: 'bg-tc-brand-soft text-tc-brand-body',
  Canopy: 'bg-tc-brand-soft text-tc-brand-body',
}

export function IndividualLeaderboard() {
  const { board, isLoading, error } = useIndividualLeaderboard(25)

  return (
    <section className="min-w-0 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Top spotters worldwide</h2>
          <p className="text-[13px] leading-5 text-tc-brand-muted">Lifetime points across the whole TruCycle community</p>
        </div>
      </div>

      {board?.currentUser ? (
        <div className="mb-4 rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-body">Your rank</p>
              <p className="mt-1 text-sm leading-5 text-tc-brand-ink">
                Global #{board.currentUser.rank.toLocaleString()} · {board.currentUser.tier}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-tc-brand-deep">
              <Sparkles size={18} />
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-tc-brand-ink">
                {board.currentUser.totalPoints.toLocaleString()}
              </p>
              <p className="text-[13px] leading-5 text-tc-brand-body">lifetime pts</p>
            </div>
            <div className="text-right">
              <p className="text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-tc-brand-ink">L{board.currentUser.currentLevel}</p>
              <p className="text-[13px] leading-5 text-tc-brand-body">level</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2.5">
        {isLoading ? <p className="px-4 py-4 text-sm text-tc-brand-body">Loading rankings...</p> : null}
        {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}
        {!isLoading && !error && board && board.entries.length === 0 ? (
          <p className="rounded-tc-md border border-dashed border-tc-brand-control p-4 text-sm text-tc-brand-body">No-one is on the leaderboard yet — post a spot to be the first!</p>
        ) : null}
        {!isLoading && !error && board
          ? board.entries.map((entry) => {
              const tierClass = tierColor[entry.tier] ?? 'bg-tc-brand-soft text-tc-brand-body'
              return (
                <div
                  key={entry.userId}
                  className={
                    entry.isCurrentUser
                      ? 'group is-you flex items-center gap-3 rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3 py-3.5 sm:gap-4 sm:px-4'
                      : 'flex items-center gap-3 rounded-tc-md border border-tc-brand-line bg-white px-3 py-3.5 transition hover:bg-tc-brand-soft sm:gap-4 sm:px-4'
                  }
                >
                  <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-tc-brand-ink">#{entry.rank}</span>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep text-xs font-semibold text-white group-[.is-you]:shadow-tc-halo">
                    {getInitials(entry.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold leading-5 text-tc-brand-ink [overflow-wrap:anywhere]">{entry.name}</p>
                      {entry.isCurrentUser ? (
                        <span className="rounded-full bg-tc-brand-deep px-2 py-0.5 text-[11px] font-semibold leading-4 text-white">You</span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold leading-4 group-[.is-you]:bg-white ${tierClass}`}>
                        {entry.tier}
                      </span>
                    </div>
                    <p className="text-[13px] leading-5 text-tc-brand-muted">
                      Level {entry.currentLevel}
                      {entry.postcode ? ` · ${entry.postcode}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className="text-base font-semibold leading-6 text-tc-brand-ink sm:text-xl sm:leading-7">
                      {entry.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">pts</p>
                  </div>
                </div>
              )
            })
          : null}
      </div>
    </section>
  )
}
