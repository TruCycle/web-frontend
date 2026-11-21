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
      <div className="rounded-tc-md bg-tc-brand-mintSoft p-4 text-sm leading-5 text-tc-brand-body">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={14} className="shrink-0 text-tc-brand-deep" />
          Live rescues will appear here as the community spots and saves items.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
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
                  'tc-rescue-ticker-row flex min-h-11 w-full items-center justify-between gap-3 rounded-tc-md border px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-tc-card',
                  isFlyTip ? 'border-tc-brand-dangerLine bg-tc-brand-dangerSoft' : 'border-tc-brand-line bg-white',
                  index === 0 ? 'tc-rescue-ticker-pop' : '',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isFlyTip ? (
                    <AlertTriangle size={16} className="shrink-0 text-tc-brand-danger" />
                  ) : (
                    <Leaf size={16} className="shrink-0 text-tc-brand-deep" />
                  )}
                  <span className="truncate font-medium text-tc-brand-ink">
                    {isFlyTip ? 'Fly-tip reported' : 'Rescued'}: {event.title}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-tc-brand-muted">
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
