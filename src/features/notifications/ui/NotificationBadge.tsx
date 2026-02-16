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

  return <span className="notification-badge">{unreadCount}</span>
}
