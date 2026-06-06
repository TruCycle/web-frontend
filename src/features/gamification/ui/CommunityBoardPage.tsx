import { useState } from 'react'
import { useCommunityBoard } from '../hooks/useCommunityBoard'
import {
  communityBoardWindows,
  getInitials,
} from './communityBoardData'
import type { CommunityBoardWindow } from '../types'
import { CommunityBoardPostcodeList } from './components/CommunityBoardPostcodeList'
import { IndividualLeaderboard } from './components/IndividualLeaderboard'

type LeaderboardTab = 'community' | 'individual'

export default function CommunityBoardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('community')
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
            <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
            <p className="text-slate-500">
              {activeTab === 'community'
                ? `Which London postcodes are rescuing the most ${activeDescriptor}.`
                : 'Top individual spotters across TruCycle, ranked by lifetime points.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {([
                { key: 'community', label: 'Community' },
                { key: 'individual', label: 'Individual' },
              ] as const).map((tab) => {
                const isActive = tab.key === activeTab
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    className={
                      isActive
                        ? 'rounded-full bg-tc-app-primary px-4 py-2 text-sm font-semibold text-tc-app-text shadow-sm transition'
                        : 'rounded-full px-4 py-2 text-sm font-medium text-tc-app-slate500 transition hover:bg-tc-app-canvas'
                    }
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === 'community' ? (
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
                          : 'rounded-full px-4 py-2 text-sm font-medium text-tc-app-slate500 transition hover:bg-tc-app-canvas'
                      }
                    >
                      {entry.label}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {activeTab === 'individual' ? <IndividualLeaderboard /> : null}
      {activeTab === 'community' ? (
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
                        ? 'flex items-center gap-3 rounded-2xl bg-tc-app-primary/15 px-4 py-4'
                        : 'flex items-center gap-3 rounded-2xl px-4 py-4 transition hover:bg-slate-50'
                    }
                  >
                    <span className="w-9 text-sm font-semibold text-slate-500">#{index + 1}</span>

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tc-app-primary/20 text-sm font-semibold text-tc-app-text">
                      {getInitials(entry.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{entry.name}</p>
                        {isCurrentUser ? (
                          <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-tc-auth-link">
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
      ) : null}
    </div>
  )
}