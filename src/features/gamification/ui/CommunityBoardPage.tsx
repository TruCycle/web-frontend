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
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Leaderboard</h1>
            <p className="mt-1 text-base leading-6 text-tc-brand-body">
              {activeTab === 'community'
                ? `Which London postcodes are rescuing the most ${activeDescriptor}.`
                : 'Top individual spotters across TruCycle, ranked by lifetime points.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex flex-wrap gap-1 rounded-tc-xl border border-tc-brand-deepLine bg-tc-brand-hover p-1">
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
                        ? 'min-h-9 rounded-full bg-tc-brand-mint px-3.5 text-[13px] font-semibold text-tc-brand-onMint transition'
                        : 'min-h-9 rounded-full px-3.5 text-[13px] font-medium text-tc-brand-onDeep transition hover:bg-tc-brand-deep hover:text-white'
                    }
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === 'community' ? (
              <div className="inline-flex flex-wrap gap-1 rounded-tc-xl border border-tc-brand-deepLine bg-tc-brand-hover p-1">
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
                          ? 'min-h-9 rounded-full bg-tc-brand-mint px-3.5 text-[13px] font-semibold text-tc-brand-onMint transition'
                          : 'min-h-9 rounded-full px-3.5 text-[13px] font-medium text-tc-brand-onDeep transition hover:bg-tc-brand-deep hover:text-white'
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
        <section className="min-w-0 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Top postcodes</h2>
              <p className="text-[13px] leading-5 text-tc-brand-muted">Ranked by catalog score {activeDescriptor}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[32px_minmax(0,1fr)_80px_52px] gap-2 px-2 text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] sm:text-xs sm:tracking-[0.06em] text-tc-brand-muted sm:grid-cols-[46px_minmax(0,1fr)_110px_82px] sm:gap-4 sm:px-4">
              <span>#</span>
              <span>Postcode Activity</span>
              <span className="text-right">Est. CO2e</span>
              <span className="text-right">Score</span>
            </div>

            {isLoading ? <p className="px-2 py-4 text-sm text-tc-brand-body sm:px-4">Loading rankings...</p> : null}
            {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}
            {!isLoading && !error && board ? (
              <CommunityBoardPostcodeList entries={board.postcodes} activeArea={board.activeArea} />
            ) : null}
          </div>
        </section>

        <section className="min-w-0 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Top spotters in {localArea}</h2>
            <p className="text-[13px] leading-5 text-tc-brand-muted">Catalog score {activeDescriptor}</p>
          </div>

          <div className="space-y-1.5">
            {isLoading ? <p className="px-2 py-4 text-sm text-tc-brand-body sm:px-4">Loading spotters...</p> : null}
            {!isLoading && !error && board ? (
              board.localSpotters.map((entry, index) => {
                const isCurrentUser = board.currentUser.localSpotterRank === index + 1

                return (
                  <div
                    key={`${entry.userId}-${activeWindow}`}
                    className={
                      isCurrentUser
                        ? 'group is-you flex items-center gap-3 rounded-tc-md bg-tc-brand-mintSoft px-2 py-4 sm:gap-4 sm:px-4'
                        : 'flex items-center gap-3 rounded-tc-md px-2 py-4 transition hover:bg-tc-brand-soft sm:gap-4 sm:px-4'
                    }
                  >
                    <span className="w-7 shrink-0 text-[13px] leading-5 tabular-nums text-tc-brand-muted sm:w-9">#{index + 1}</span>

                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-[13px] font-semibold text-tc-brand-deep group-[.is-you]:bg-white">
                      {getInitials(entry.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-5 text-tc-brand-ink [overflow-wrap:anywhere]">{entry.name}</p>
                        {isCurrentUser ? (
                          <span className="rounded-full bg-tc-brand-deep px-2 py-0.5 text-xs font-semibold leading-4 text-white">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[13px] leading-5 text-tc-brand-muted">
                        {entry.spotsPosted} spots · {entry.rescues} rescues
                      </p>
                    </div>

                    <div className="shrink-0 text-right tabular-nums">
                      <p className="text-xl font-semibold leading-7 text-tc-brand-ink">
                        {entry.impactPoints.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">pts</p>
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