import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useCommunityBoard } from '../hooks/useCommunityBoard'
import {
  communityBoardWindows,
  getInitials,
} from './communityBoardData'
import type { CommunityBoardWindow } from '../types'
import { CommunityBoardPostcodeList } from './components/CommunityBoardPostcodeList'

export default function CommunityBoardPage() {
  const [activeWindow, setActiveWindow] = useState<CommunityBoardWindow>('month')
  const { board, isLoading, error } = useCommunityBoard(activeWindow)
  const activeDescriptor =
    communityBoardWindows.find((entry) => entry.key === activeWindow)?.descriptor ?? 'this month'
  const localArea = board?.activeArea ?? board?.postcodes[0]?.postcode ?? 'your area'

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Community Board</h1>
            <p className="text-slate-500">
              Which London postcodes are rescuing the most {activeDescriptor}.
            </p>
          </div>

          <div className="inline-flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {communityBoardWindows.map((entry) => {
              const isActive = entry.key === activeWindow

              return (
                <button
                  key={entry.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveWindow(entry.key)}
                  className={
                    isActive
                      ? 'rounded-full bg-tc-app-primary px-4 py-2 text-sm font-semibold text-tc-app-text shadow-sm transition'
                      : 'rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100'
                  }
                >
                  {entry.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Top postcodes</h2>
              <p className="text-sm text-slate-500">Ranked by impact score {activeDescriptor}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[46px_minmax(0,1fr)_110px_82px] gap-4 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>#</span>
              <span>Postcode Activity</span>
              <span className="text-right">CO2e</span>
              <span className="text-right">Score</span>
            </div>

            {isLoading ? <p className="px-4 py-4 text-sm text-slate-500">Loading rankings...</p> : null}
            {error ? <p className="px-4 py-4 text-sm text-rose-600">{error}</p> : null}
            {!isLoading && !error && board ? (
              <CommunityBoardPostcodeList entries={board.postcodes} activeArea={board.activeArea} />
            ) : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Top spotters in {localArea}</h2>
            <p className="text-sm text-slate-500">Impact score {activeDescriptor}</p>
          </div>

          <div className="mb-4 rounded-2xl bg-[linear-gradient(135deg,#F4F9E8_0%,#EEF6DE_100%)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#55741D]">Your standing</p>
                <p className="mt-2 text-sm text-slate-600">
                  {board?.currentUser.areaRank ? `Area rank #${board.currentUser.areaRank}` : 'Rank appears once activity lands in your area.'}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[#55741D] shadow-sm">
                <Sparkles size={18} />
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {board?.currentUser.impactPoints ?? 0}
                </p>
                <p className="text-sm text-slate-500">impact pts</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {board?.currentUser.spotsPosted ?? 0}
                </p>
                <p className="text-sm text-slate-500">spots posted</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {isLoading ? <p className="px-4 py-4 text-sm text-slate-500">Loading spotters...</p> : null}
            {!isLoading && !error && board ? (
              board.localSpotters.map((entry, index) => {
                const isCurrentUser = board.currentUser.localSpotterRank === index + 1

                return (
                  <div
                    key={`${entry.userId}-${activeWindow}`}
                    className={
                      isCurrentUser
                        ? 'flex items-center gap-3 rounded-2xl bg-[#F1F9EA] px-4 py-4'
                        : 'flex items-center gap-3 rounded-2xl px-4 py-4 transition hover:bg-slate-50'
                    }
                  >
                    <span className="w-9 text-sm font-semibold text-slate-500">#{index + 1}</span>

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E5F5D7] text-sm font-semibold text-[#3A7A28]">
                      {getInitials(entry.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{entry.name}</p>
                        {isCurrentUser ? (
                          <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-[#1A7F37]">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-500">
                        {entry.spotsPosted} spots · {entry.rescues} rescues
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">
                        {entry.impactPoints.toLocaleString()}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">pts</p>
                    </div>
                  </div>
                )
              })
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}