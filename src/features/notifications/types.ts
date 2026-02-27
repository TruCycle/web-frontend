export interface NotificationItem {
  readonly id: string
  readonly type: string
  readonly title: string
  readonly body: string
  readonly data: Record<string, unknown> | null
  readonly createdAt: string
  readonly readAt: string | null
  readonly isRead: boolean
}
