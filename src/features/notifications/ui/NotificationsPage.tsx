import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { Button } from '@/shared/ui/button/Button'

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString()
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    reload,
  } = useNotifications()

  if (isLoading) {
    return <p className="page-status">Loading notifications...</p>
  }

  return (
    <section className="page-card">
      <div className="row-between">
        <div>
          <h1>Notifications</h1>
          <p>
            Persisted local scaffold with read/unread controls and badge count.
          </p>
        </div>
        <div className="inline-actions">
          <Button onClick={markAllAsRead} variant="secondary">
            Mark all as read
          </Button>
          <Button onClick={reload} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      {error ? <p className="page-status-error">{error}</p> : null}

      {notifications.length === 0 ? (
        <p className="page-status">No notifications yet.</p>
      ) : (
        <ul className="list-reset stack-gap-sm">
          {notifications.map((notification) => (
            <li className="surface-row" key={notification.id}>
              <div className="row-between">
                <p className="row-title">{notification.title}</p>
                {!notification.isRead ? (
                  <Button
                    onClick={() => void markAsRead(notification.id)}
                    variant="secondary"
                  >
                    Mark as read
                  </Button>
                ) : null}
              </div>
              <p className="row-body">{notification.description}</p>
              <p className="row-meta">{formatDate(notification.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="row-meta">Unread notifications: {unreadCount}</p>
    </section>
  )
}
