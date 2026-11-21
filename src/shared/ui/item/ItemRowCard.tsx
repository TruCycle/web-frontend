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
    return 'bg-tc-brand-mint text-tc-brand-onMint'
  }
  if (statusTone === 'claimed') {
    return 'bg-amber-100 text-amber-800'
  }
  if (statusTone === 'collected') {
    return 'bg-tc-brand-soft text-tc-brand-muted'
  }
  return 'bg-tc-brand-soft text-tc-brand-body'
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
        'flex flex-wrap items-center justify-between gap-3 rounded-tc-lg border border-tc-brand-line bg-white p-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt ?? title} className="h-20 w-20 shrink-0 rounded-tc-md object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-tc-md bg-tc-brand-soft text-xs text-tc-brand-muted">
            No image
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base leading-6 font-semibold text-tc-brand-ink">{title}</h3>
            <span
              className={classNames(
                'rounded-full px-2.5 py-1 text-xs leading-4 font-semibold',
                statusClasses(statusTone),
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[13px] leading-5 text-tc-brand-muted">{subtitle}</p>
        </div>
      </div>

      {actions ? <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
