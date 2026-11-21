interface NotificationBadgeProps {
  readonly unreadCount: number
  readonly isLoading?: boolean
}

export function NotificationBadge({
  unreadCount,
  isLoading = false,
}: NotificationBadgeProps) {
  if (isLoading || unreadCount === 0) {
    return null
  }

  return (
    <span className="inline-flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-full bg-tc-brand-mint px-[0.35rem] text-xs font-semibold text-tc-brand-onMint">
      {unreadCount}
    </span>
  )
}
