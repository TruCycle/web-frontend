import { classNames } from '@/shared/utils/classNames'
import type { FoundItemStatus } from '../../types'

interface FoundItemStatusBadgeProps {
  readonly status: FoundItemStatus
}

function labelForStatus(status: FoundItemStatus): string {
  return status === 'available' ? 'live' : status.replace('_', ' ')
}

export function FoundItemStatusBadge({ status }: FoundItemStatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-4 font-semibold capitalize',
        status === 'available' && 'bg-tc-brand-mintSoft text-tc-brand-deep',
        status === 'claimed' && 'bg-amber-100 text-amber-900',
        status === 'picked_up' && 'bg-tc-brand-soft text-tc-brand-body',
        (status === 'expired' || status === 'gone') && 'bg-tc-brand-soft text-tc-brand-muted',
        status === 'reported' && 'bg-tc-brand-dangerSoft text-tc-brand-danger',
      )}
    >
      {labelForStatus(status)}
    </span>
  )
}
