// Same-window invalidation only. Counts remain authoritative API projections.
export const unreadChangedEvent = 'trucycle:message-unread-changed'
export function notifyUnreadChanged(): void {
  window.dispatchEvent(new Event(unreadChangedEvent))
}
