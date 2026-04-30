import { useEffect, useState, type ReactNode } from 'react'
import { Award, ChevronRight, Flame, Medal, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { fetchPointHistory } from '../api/gamificationApi'
import { useBadges } from '../hooks/useBadges'
import { useFoundItemImpact } from '../hooks/useFoundItemImpact'
import { useStreaks } from '../hooks/useStreaks'
import { useUserProgress } from '../hooks/useUserProgress'
import type { PointTransaction } from '../types'
import { BadgeGrid } from './components/BadgeGrid'
import { FoundItemImpactOverview } from './components/FoundItemImpactOverview'
import { LevelBadge } from './components/LevelBadge'
import { ProgressBar } from './components/ProgressBar'

function formatDate(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
}

interface ImpactMetricCardProps {
  readonly title: string
  readonly value: ReactNode
  readonly detail: string
  readonly icon: ReactNode
  readonly accentClassName: string
}

function ImpactMetricCard({
  title,
  value,
  detail,
  icon,
  accentClassName,
}: ImpactMetricCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.97)_46%,rgba(17,94,89,0.92)_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
      <div className="pointer-events-none absolute inset-0">
        <div className={`animate-impact-glow absolute -left-10 top-5 h-32 w-32 rounded-full blur-3xl ${accentClassName}`} />
        <div
          className={`animate-impact-glow-delayed absolute -right-8 bottom-0 h-36 w-36 rounded-full blur-3xl ${accentClassName}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_26%),linear-gradient(120deg,rgba(255,255,255,0.08),transparent_42%)] opacity-80" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white/72">{title}</p>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-sm">
            {icon}
          </span>
        </div>

        <div className="mt-6">{value}</div>
        <p className="mt-4 text-sm text-white/70">{detail}</p>
      </div>
    </section>
  )
}

export default function AchievementsPage() {
  useAuthSession()
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
  const {
    summary: foundItemImpact,
    isLoading: isLoadingFoundItemImpact,
    error: foundItemImpactError,
  } = useFoundItemImpact()
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

  const streakUnitLabel = primaryStreak?.streakType === 'weekly' ? 'weeks' : 'days'
  const currentStreak = isLoadingStreaks ? '-' : primaryStreak?.currentStreak ?? 0
  const longestStreak = isLoadingStreaks ? '-' : streaks[0]?.longestStreak ?? 0
  const totalPoints = isLoadingProgress ? '-' : progress?.totalPoints ?? 0
  const pointsToNextLevel = isLoadingProgress ? '-' : progress?.pointsToNextLevel ?? 0
  const badgeCount = isLoadingBadges ? '-' : earnedCount
  const badgesLeft = Math.max(0, badges.length - earnedCount)
  const currentAreaRank = isLoadingFoundItemImpact ? '-' : foundItemImpact?.currentMonthAreaRank ?? '—'
  const currentArea = foundItemImpact?.userArea ?? 'your area'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Impact</h1>
          <p className="text-slate-500">Track your streaks, rewards and local momentum.</p>
        </div>
        <Link
          to="/community-board"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Community Board
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ImpactMetricCard
          title="Daily streak"
          value={
            <div className="flex items-end gap-2">
              <span className="text-4xl font-semibold tracking-tight text-white">{currentStreak}</span>
              <span className="pb-1 text-sm text-white/72">{streakUnitLabel} active</span>
            </div>
          }
          detail={`Best ${longestStreak} ${streakUnitLabel}`}
          icon={<Flame size={20} className="text-amber-300" />}
          accentClassName="bg-amber-400/35"
        />

        <ImpactMetricCard
          title="Total points"
          value={<p className="text-4xl font-semibold tracking-tight text-white">{totalPoints}</p>}
          detail={`Next level in ${pointsToNextLevel} pts`}
          icon={<Sparkles size={20} className="text-emerald-200" />}
          accentClassName="bg-emerald-400/35"
        />

        <ImpactMetricCard
          title="Badges earned"
          value={<p className="text-4xl font-semibold tracking-tight text-white">{badgeCount}</p>}
          detail={`${badgesLeft} left to unlock`}
          icon={<Award size={20} className="text-cyan-200" />}
          accentClassName="bg-cyan-400/30"
        />

        <ImpactMetricCard
          title="Community rank"
          value={<p className="text-4xl font-semibold tracking-tight text-white">{typeof currentAreaRank === 'number' ? `#${currentAreaRank}` : currentAreaRank}</p>}
          detail={`Found-item standing in ${currentArea} this month`}
          icon={<Medal size={20} className="text-lime-200" />}
          accentClassName="bg-lime-400/30"
        />
      </div>

      <FoundItemImpactOverview
        summary={foundItemImpact}
        isLoading={isLoadingFoundItemImpact}
        error={foundItemImpactError}
      />

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