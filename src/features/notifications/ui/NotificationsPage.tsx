import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import './NotificationsPage.css'

function formatNotificationTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function NotificationsPage() {
  const { notifications, isLoading, error, markAsRead } = useNotifications()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && notifications.length > 0 && !selectedId) {
      setSelectedId(notifications[0].id)
    }
  }, [isLoading, notifications, selectedId])

  const handleSelect = (notificationId: string) => {
    setSelectedId(notificationId)
    void markAsRead(notificationId)
  }

  const hasNotifications = notifications.length > 0
  const emptyStateLabel = useMemo(
    () => (isLoading ? '' : 'No notifications yet.'),
    [isLoading],
  )

  return (
    <div className="notifications-page-card">
      <h2 className="notifications-title notifications-header">
        Recent Notifications
      </h2>

      <div className="notifications-list">
        {isLoading ? (
          <div className="notifications-state">
            <LoadingState label="Loading notifications" />
          </div>
        ) : null}

        {error ? <p className="notifications-error">{error}</p> : null}

        {!isLoading && !hasNotifications ? (
          <p className="notifications-empty">{emptyStateLabel}</p>
        ) : null}

        {!isLoading && hasNotifications
          ? notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${
                  selectedId === notification.id ? 'active' : ''
                } ${notification.isRead ? '' : 'unread'}`}
                onClick={() => handleSelect(notification.id)}
              >
                <div className="notification-icon-wrapper">
                  <Bell size={20} color="#64748b" />
                </div>

                <div className="notification-content">
                  <div className="notification-main-row">
                    <h3 className="notification-title">
                      {notification.title}
                    </h3>
                    <span className="notification-time">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="notification-description">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}
