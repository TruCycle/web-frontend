import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { LevelTrack } from './components/LevelTrack'
import { TierBadge } from './components/TierBadge'
import { CarbonLedgerPanel } from './components/CarbonLedgerPanel'
import { useConfetti } from '@/shared/hooks/useConfetti'

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
    <section className="group relative min-w-0 flex-[1_1_150px] overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white p-6 text-tc-brand-ink has-[.tc-impact-hero]:order-first has-[.tc-impact-hero]:flex-[2_1_420px] has-[.tc-impact-hero]:border-tc-brand-mintLine has-[.tc-impact-hero]:bg-tc-brand-mintSoft">
      <div className="pointer-events-none absolute inset-0">
        <div className={`animate-impact-glow absolute -left-10 top-5 h-32 w-32 rounded-full blur-3xl ${accentClassName}`} />
        <div
          className={`animate-impact-glow-delayed absolute -right-8 bottom-0 h-36 w-36 rounded-full blur-3xl ${accentClassName}`}
        />
        <div className="absolute inset-0" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-col-reverse items-start gap-2 group-has-[.tc-impact-hero]:flex-row group-has-[.tc-impact-hero]:justify-between group-has-[.tc-impact-hero]:gap-4">
          <p className="text-[13px] leading-5 text-tc-brand-muted group-has-[.tc-impact-hero]:text-tc-brand-body">{title}</p>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep group-has-[.tc-impact-hero]:bg-white">
            {icon}
          </span>
        </div>

        <div className="mt-1 min-w-0">{value}</div>
        <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted group-has-[.tc-impact-hero]:mt-auto group-has-[.tc-impact-hero]:pt-5 group-has-[.tc-impact-hero]:text-tc-brand-body">{detail}</p>
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
    isLoading: isLoadingBadges,
    error: badgeError,
    dismissNew,
  } = useBadges('all')
  const {
    summary: foundItemImpact,
    isLoading: isLoadingFoundItemImpact,
  } = useFoundItemImpact()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const { fireMilestone } = useConfetti()
  const prevLevelRef = useRef<number | null>(null)
  const confettiFiredRef = useRef(false)

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

  // Fire confetti when new badges are present or when the level increments
  useEffect(() => {
    if (isLoadingBadges || isLoadingProgress || confettiFiredRef.current) return
    const hasNewBadge = earnedBadges.some((b) => b.isNew)
    const currentLevel = progress?.currentLevel ?? null
    const leveledUp = prevLevelRef.current !== null && currentLevel !== null && currentLevel > prevLevelRef.current
    if (hasNewBadge || leveledUp) {
      confettiFiredRef.current = true
      fireMilestone()
    }
    prevLevelRef.current = currentLevel
  }, [isLoadingBadges, isLoadingProgress, earnedBadges, progress, fireMilestone])

  const streakUnitLabel = primaryStreak?.streakType === 'weekly' ? 'weeks' : 'days'
  const currentStreak = isLoadingStreaks ? '-' : primaryStreak?.currentStreak ?? 0
  const longestStreak = isLoadingStreaks ? '-' : streaks[0]?.longestStreak ?? 0
  const totalPoints = isLoadingProgress ? '-' : progress?.totalPoints ?? 0
  const pointsToNextLevel = isLoadingProgress ? '-' : progress?.pointsToNextLevel ?? 0
  const currentAreaRank = isLoadingFoundItemImpact ? '-' : foundItemImpact?.currentMonthAreaRank ?? '—'
  const currentArea = foundItemImpact?.userArea ?? 'your area'

  return (
    <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 lg:col-span-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">My Impact</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Track your streaks, rewards and local momentum.</p>
        </div>
        <Link
          to="/community-board"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-3 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
        >
          Community Board
          <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex min-w-0 flex-wrap items-stretch gap-4 lg:col-span-5">
        <ImpactMetricCard
          title="Daily streak"
          value={
            <div className="flex items-end gap-2">
              <span className="text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-tc-brand-ink">{currentStreak}</span>
              <span className="pb-1 text-[13px] leading-5 text-tc-brand-muted">{streakUnitLabel} active</span>
            </div>
          }
          detail={`Best ${longestStreak} ${streakUnitLabel}${
            primaryStreak && (primaryStreak.bonusMultiplier ?? 1) > 1 ? ' · +5% bonus active' : ''
          }`}
          icon={<Flame size={20} className="text-tc-brand-deep" />}
          accentClassName="bg-transparent"
        />

        <ImpactMetricCard
          title="Total points"
          value={<p className="text-5xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-tc-brand-ink">{totalPoints}</p>}
          detail={`Next level in ${pointsToNextLevel} pts`}
          icon={<Sparkles size={20} className="text-tc-brand-deep" />}
          accentClassName="tc-impact-hero bg-transparent"
        />

        <ImpactMetricCard
          title="Estimated CO2e (picked up)"
          value={<p className="text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-tc-brand-ink [overflow-wrap:anywhere]">{isLoadingFoundItemImpact ? '-' : foundItemImpact?.totalCo2eKg ?? 'Unavailable'}</p>}
          detail="kg CO2e - estimates, not measured savings"
          icon={<Award size={20} className="text-tc-brand-deep" />}
          accentClassName="bg-transparent"
        />

        <ImpactMetricCard
          title="Community rank"
          value={<p className="text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums text-tc-brand-ink [overflow-wrap:anywhere]">{typeof currentAreaRank === 'number' ? `#${currentAreaRank}` : currentAreaRank}</p>}
          detail={`Found-item standing in ${currentArea} this month`}
          icon={<Medal size={20} className="text-tc-brand-deep" />}
          accentClassName="bg-transparent"
        />
      </div>

      <section className="min-w-0 space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-6 lg:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Level progress</h2>
            <p className="text-[13px] leading-5 text-tc-brand-muted">Current momentum</p>
          </div>
        </div>

        {progress?.tier ? (
          <TierBadge
            tier={progress.tier}
            nextTier={progress.nextTier ?? null}
            pointsToNextTier={progress.pointsToNextTier ?? 0}
            progressPercent={progress.tierProgressPercent ?? 0}
          />
        ) : null}

        {progress ? <LevelTrack progress={progress} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] leading-5 tabular-nums text-tc-brand-body">
          <span>{progress?.totalPoints ?? 0} pts banked</span>
          <span>{progress?.pointsToNextLevel ?? 0} pts to go</span>
        </div>

        {progressError ? <p className="text-sm text-tc-brand-danger">{progressError}</p> : null}
        {streakError ? <p className="text-sm text-tc-brand-danger">{streakError}</p> : null}
      </section>

      {foundItemImpact ? (
        <CarbonLedgerPanel
          co2eTotalKg={foundItemImpact.totalCo2eKg}
          impactPoints={progress?.totalPoints ?? null}
        />
      ) : null}

      <section className="min-w-0 space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-6 lg:order-last lg:col-span-2 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Badge board</h2>
            <p className="text-[13px] leading-5 text-tc-brand-muted">Recent wins stay at the top.</p>
          </div>
        </div>

        {badgeError ? <p className="text-sm text-tc-brand-danger">{badgeError}</p> : null}
        {isLoadingBadges ? <p className="text-sm text-tc-brand-body">Loading badges...</p> : null}
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

      <section className="min-w-0 rounded-tc-lg border border-tc-brand-line bg-white p-6 lg:col-span-3 lg:self-start">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Recent points</h2>
            <p className="text-[13px] leading-5 text-tc-brand-muted">Latest moves</p>
          </div>
        </div>

        <div className="flex flex-col">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-4 border-t border-tc-brand-line py-3.5"
            >
              <div>
                <p className="text-sm font-medium leading-5 text-tc-brand-ink">{transaction.reason}</p>
                <p className="text-[13px] leading-5 text-tc-brand-muted">{formatDate(transaction.createdAt)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-[13px] font-semibold tabular-nums text-tc-brand-deep">
                +{transaction.points}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
