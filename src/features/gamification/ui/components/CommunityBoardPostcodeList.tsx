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
                ? 'grid grid-cols-[46px_minmax(0,1fr)_110px_82px] gap-4 rounded-2xl bg-[#F1F9EA] px-4 py-4'
                : 'grid grid-cols-[46px_minmax(0,1fr)_110px_82px] gap-4 rounded-2xl px-4 py-4 transition hover:bg-slate-50'
            }
          >
            <div className="flex items-start pt-1">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${rankPillClassName(index)}`}
              >
                {index < 3 ? <Medal size={14} /> : index + 1}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{entry.postcode}</p>
                {isActiveArea ? (
                  <span className="rounded-full bg-[#D8F2C9] px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#1A7F37]">
                    You
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {entry.spots} spots · {entry.rescues} rescues · {entry.activeSpots} live
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">{entry.totalCo2eKg} kg</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CO2e</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-[#55741D]">{entry.impactPoints}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}