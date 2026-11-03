const maxTimerDelay = 2 ** 31 - 1

export function sessionRefreshAt(expiry: number, now: number, hasRefresh: boolean): number {
  const remaining = Math.max(0, expiry - now)
  return expiry - (hasRefresh ? Math.min(5 * 60_000, remaining / 2) : 0)
}

export function sessionWakeDelay(at: number, now: number): number {
  return Math.min(maxTimerDelay, Math.max(0, at - now))
}
