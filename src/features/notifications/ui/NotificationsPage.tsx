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
  const { notifications, isLoading, isMarkingRead, error, reload, markAsRead, markAllAsRead, unreadCount } =
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
    <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold leading-6 text-tc-brand-ink">Recent Notifications</h1>
        <Button
          disabled={isLoading || isMarkingRead || unreadCount === 0}
          variant="secondary"
          onClick={() => {
            void markAllAsRead()
          }}
        >
          {isMarkingRead ? 'Saving read status…' : 'Mark all as read'}
        </Button>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <div>
            <LoadingState label="Loading notifications" />
          </div>
        ) : null}

        {error ? <p role="status" className="text-sm text-tc-brand-danger">{error}{' '}
          <button type="button" className="min-h-11 font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading} onClick={() => void reload()}>Refresh notifications</button>
        </p> : null}

        {!isLoading && !error && !hasNotifications ? (
          <p className="rounded-tc-md border border-dashed border-tc-brand-control px-4 py-3.5 text-sm text-tc-brand-body">{emptyStateLabel}</p>
        ) : null}

        {!isLoading && hasNotifications
          ? notifications.map((notification) => (
              <button
                type="button"
                disabled={isMarkingRead}
                key={notification.id}
                className={`w-full cursor-pointer rounded-tc-md border p-4 text-left transition disabled:cursor-not-allowed ${
                  activeId === notification.id
                    ? 'border-tc-brand-mintLine bg-tc-brand-mintSoft'
                    : 'border-tc-brand-line bg-white hover:border-tc-brand-control hover:bg-tc-brand-haze'
                }`}
                onClick={() => handleSelect(notification.id)}
              >
                <span className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tc-brand-line bg-white text-tc-brand-deep">
                    <Bell size={18} aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className={`text-sm ${notification.isRead ? 'font-medium text-tc-brand-body' : 'font-semibold text-tc-brand-ink'}`}>
                        <span className="sr-only">{notification.isRead ? 'Read notification. ' : 'Unread notification. '}</span>
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-xs leading-5 text-tc-brand-muted">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-tc-brand-body">{notification.body}</span>
                  </span>
                </span>
              </button>
            ))
          : null}
      </div>
    </div>
  )
}
