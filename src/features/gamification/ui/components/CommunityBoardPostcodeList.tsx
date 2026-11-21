import { Medal } from 'lucide-react'
import type { CommunityBoardPostcodeEntry } from '../../types'
import { rankPillClassName } from '../communityBoardData'

interface CommunityBoardPostcodeListProps {
  readonly entries: CommunityBoardPostcodeEntry[]
  readonly activeArea: string | null
}

export function CommunityBoardPostcodeList({
  entries,
  activeArea,
}: CommunityBoardPostcodeListProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isActiveArea = activeArea === entry.postcode

        return (
          <div
            key={entry.postcode}
            className={
              isActiveArea
                ? 'group is-you grid grid-cols-[32px_minmax(0,1fr)_80px_52px] items-center gap-2 rounded-tc-md bg-tc-brand-mintSoft px-2 py-4 sm:grid-cols-[46px_minmax(0,1fr)_110px_82px] sm:gap-4 sm:px-4'
                : 'grid grid-cols-[32px_minmax(0,1fr)_80px_52px] items-center gap-2 rounded-tc-md px-2 py-4 transition hover:bg-tc-brand-soft sm:grid-cols-[46px_minmax(0,1fr)_110px_82px] sm:gap-4 sm:px-4'
            }
          >
            <div className="flex items-center">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums group-[.is-you]:bg-white sm:h-10 sm:w-10 ${rankPillClassName(index)}`}
              >
                {index < 3 ? <Medal size={14} /> : index + 1}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold leading-6 text-tc-brand-ink">{entry.postcode}</p>
                {isActiveArea ? (
                  <span className="rounded-full bg-tc-brand-deep px-2 py-0.5 text-xs font-semibold leading-4 text-white">
                    You
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[13px] leading-5 text-tc-brand-muted">
                {entry.spots} spots · {entry.rescues} rescues · {entry.activeSpots} live
              </p>
            </div>

            <div className="min-w-0 text-right tabular-nums">
              <p className="text-sm font-semibold leading-5 text-tc-brand-ink sm:text-xl sm:leading-7">
                {entry.totalCo2eKg === null ? 'Unavailable' : `${entry.totalCo2eKg} kg`}
              </p>
              <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] text-tc-brand-muted sm:text-xs sm:tracking-[0.06em]">Est. CO2e</p>
            </div>

            <div className="min-w-0 text-right tabular-nums">
              <p className="text-sm font-semibold leading-5 text-tc-brand-ink sm:text-xl sm:leading-7">{entry.impactPoints}</p>
              <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] text-tc-brand-muted sm:text-xs sm:tracking-[0.06em]">score</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
