import type { ReactNode } from 'react'
import { classNames } from '@/shared/utils/classNames'

type ItemStatusTone = 'active' | 'claimed' | 'collected' | 'neutral'

interface ItemRowCardProps {
  readonly title: string
  readonly subtitle: string
  readonly statusLabel: string
  readonly statusTone?: ItemStatusTone
  readonly imageUrl: string | null
  readonly imageAlt?: string
  readonly actions?: ReactNode
  readonly className?: string
}

function statusClasses(statusTone: ItemStatusTone): string {
  if (statusTone === 'active') {
    return 'bg-[#A4F5A6] text-[#135E13]'
  }
  if (statusTone === 'claimed') {
    return 'bg-slate-200 text-slate-700'
  }
  if (statusTone === 'collected') {
    return 'bg-[#A4F5A61A] text-[#15A119] ring-1 ring-[#7DE481]'
  }
  return 'bg-slate-100 text-slate-700'
}

export function ItemRowCard({
  title,
  subtitle,
  statusLabel,
  statusTone = 'neutral',
  imageUrl,
  imageAlt,
  actions,
  className,
}: ItemRowCardProps) {
  return (
    <div
      className={classNames(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt ?? title} className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-[11px] text-slate-500">
            No image
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-[#222222]">{title}</h3>
            <span
              className={classNames(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusClasses(statusTone),
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 truncate text-sm text-[#12121299]">{subtitle}</p>
        </div>
      </div>

      {actions ? <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
