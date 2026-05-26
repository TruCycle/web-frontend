import { Leaf, Sparkles, AlertTriangle } from 'lucide-react'
import { useRescueTicker, type RescueTickerEvent } from '../../hooks/useRescueTicker'
import { classNames } from '@/shared/utils/classNames'

interface RescueTickerProps {
  readonly onItemClick?: (event: RescueTickerEvent) => void
}

function relativeFromNow(iso: string): string {
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return 'just now'
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 30) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export function RescueTicker({ onItemClick }: RescueTickerProps) {
  const events = useRescueTicker({ bufferSize: 8 })

  if (events.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-tc-app-primary/30 bg-tc-app-canvas px-4 py-3 text-sm text-tc-app-slate500">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} className="text-tc-shell-accent" />
          Live rescues will appear here as the community spots and saves items.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-tc-app-slate500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tc-shell-accent opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-tc-shell-accent" />
        </span>
        Live rescues
      </div>
      <ul className="space-y-2">
        {events.map((event, index) => {
          const isFlyTip = event.kind === 'flytip'
          return (
            <li key={`${event.id}-${event.receivedAt}`}>
              <button
                type="button"
                onClick={() => onItemClick?.(event)}
                className={classNames(
                  'tc-rescue-ticker-row flex w-full items-center justify-between gap-3 rounded-[16px] border bg-white px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-sm',
                  isFlyTip ? 'border-rose-200 bg-rose-50/40' : 'border-tc-app-primary/25 bg-tc-app-canvas/40',
                  index === 0 ? 'tc-rescue-ticker-pop' : '',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isFlyTip ? (
                    <AlertTriangle size={16} className="shrink-0 text-rose-500" />
                  ) : (
                    <Leaf size={16} className="shrink-0 text-tc-auth-link" />
                  )}
                  <span className="truncate font-medium text-slate-900">
                    {isFlyTip ? 'Fly-tip reported' : 'Rescued'}: {event.title}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                  {event.co2eKg != null ? (
                    <span className="hidden sm:inline">{event.co2eKg.toFixed(1)} kg CO2e</span>
                  ) : null}
                  <span>{relativeFromNow(event.receivedAt)}</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
