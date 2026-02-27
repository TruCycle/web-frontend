import { useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import { Button } from '@/shared/ui/button/Button'

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
  const { notifications, isLoading, error, markAsRead, markAllAsRead, unreadCount } =
    useNotifications()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? notifications[0]?.id ?? null

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Recent Notifications</h2>
        <Button
          disabled={isLoading || unreadCount === 0}
          variant="secondary"
          onClick={() => {
            void markAllAsRead()
          }}
        >
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div>
            <LoadingState label="Loading notifications" />
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {!isLoading && !hasNotifications ? (
          <p className="text-sm text-slate-500">{emptyStateLabel}</p>
        ) : null}

        {!isLoading && hasNotifications
          ? notifications.map((notification) => (
              <div
                key={notification.id}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  activeId === notification.id
                    ? 'border-lime-300 bg-lime-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => handleSelect(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Bell size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-sm ${notification.isRead ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  )
}
