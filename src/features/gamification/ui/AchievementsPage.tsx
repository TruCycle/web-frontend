import { useEffect, useState } from 'react'
import { Award, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchPointHistory } from '../api/gamificationApi'
import { useBadges } from '../hooks/useBadges'
import { useStreaks } from '../hooks/useStreaks'
import { useUserProgress } from '../hooks/useUserProgress'
import type { PointTransaction } from '../types'
import { BadgeGrid } from './components/BadgeGrid'
import { LevelBadge } from './components/LevelBadge'
import { ProgressBar } from './components/ProgressBar'
import { StreakIndicator } from './components/StreakIndicator'

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
}

export default function AchievementsPage() {
  const { progress, isLoading: isLoadingProgress, error: progressError } = useUserProgress()
  const { primaryStreak, streaks, isLoading: isLoadingStreaks, error: streakError } = useStreaks()
  const {
    badges,
    earnedBadges,
    earnedCount,
    isLoading: isLoadingBadges,
    error: badgeError,
    dismissNew,
  } = useBadges('all')
  const [transactions, setTransactions] = useState<PointTransaction[]>([])

  useEffect(() => {
    let isMounted = true

    void fetchPointHistory(1, 5).then((response) => {
      if (isMounted) {
        setTransactions(response.transactions)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Achievements</h1>
          <p className="text-slate-500">Streaks, levels and badges.</p>
        </div>
        <Link
          to="/found-items"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Community Board
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Daily streak</p>
          <div className="mt-3 flex items-center justify-between">
            {primaryStreak ? <StreakIndicator streak={primaryStreak} size="lg" /> : null}
            <Sparkles size={20} className="text-[#34DA45]" />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Best {isLoadingStreaks ? '-' : streaks[0]?.longestStreak ?? 0}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total points</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {isLoadingProgress ? '-' : progress?.totalPoints ?? 0}
          </p>
          <p className="mt-4 text-sm text-slate-500">Next level in {progress?.pointsToNextLevel ?? '-'} pts</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Badges</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-bold text-slate-900">{isLoadingBadges ? '-' : earnedCount}</p>
            <Award size={20} className="text-[#1A7F37]" />
          </div>
          <p className="mt-4 text-sm text-slate-500">{badges.length - earnedCount} left to unlock</p>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Level progress</h2>
            <p className="text-sm text-slate-500">Current momentum</p>
          </div>
          {progress ? <LevelBadge progress={progress} /> : null}
        </div>

        <ProgressBar value={progress?.levelProgressPercent ?? 0} />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>{progress?.totalPoints ?? 0} pts banked</span>
          <span>{progress?.pointsToNextLevel ?? 0} pts to go</span>
        </div>

        {progressError ? <p className="text-sm text-rose-600">{progressError}</p> : null}
        {streakError ? <p className="text-sm text-rose-600">{streakError}</p> : null}
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Badge board</h2>
            <p className="text-sm text-slate-500">Recent wins stay at the top.</p>
          </div>
        </div>

        {badgeError ? <p className="text-sm text-rose-600">{badgeError}</p> : null}
        {isLoadingBadges ? <p className="text-sm text-slate-500">Loading badges...</p> : null}
        {!isLoadingBadges && !badgeError ? (
          <BadgeGrid
            badges={badges}
            earnedBadges={earnedBadges}
            onDismissNew={(badgeId) => {
              void dismissNew(badgeId)
            }}
          />
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent points</h2>
            <p className="text-sm text-slate-500">Latest moves</p>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{transaction.reason}</p>
                <p className="text-sm text-slate-500">{formatDate(transaction.createdAt)}</p>
              </div>
              <span className="rounded-full bg-[#E9FCE8] px-3 py-1 text-sm font-semibold text-[#166534]">
                +{transaction.points}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}