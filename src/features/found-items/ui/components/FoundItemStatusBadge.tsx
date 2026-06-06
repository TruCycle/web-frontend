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
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
        status === 'available' && 'bg-[#E9FCE8] text-[#166534]',
        status === 'claimed' && 'bg-[#FFF4D9] text-[#D97706]',
        status === 'picked_up' && 'bg-[#F1F5F9] text-slate-600',
        status === 'expired' && 'bg-[#FFF7ED] text-[#C2410C]',
        status === 'reported' && 'bg-[#FEF2F2] text-[#DC2626]',
      )}
    >
      {labelForStatus(status)}
    </span>
  )
}
