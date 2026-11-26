import type { RoomMessage } from '@/features/messaging/types'

export interface HistoryPage { readonly messages: RoomMessage[]; readonly nextCursor: string | null }
export interface HistoryRecovery {
  readonly messages: RoomMessage[]
  readonly nextCursor: string | null
  readonly status: 'complete' | 'partial' | 'changed'
}
/** Recover a retained-history gap in bounded batches, keeping its original anchor. */
export async function recoverHistory(
  fetchPage: (cursor?: string) => Promise<HistoryPage>,
  knownIds: ReadonlySet<string>,
  cursor?: string,
  maxPages = 5,
  scanToEnd = false,
): Promise<HistoryRecovery> {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 20) throw new Error('Invalid history recovery budget')
  const messages = new Map<string, RoomMessage>()
  const visited = new Set<string>()
  let next = cursor
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    if (next && visited.has(next)) throw new Error('History cursor did not advance')
    if (next) visited.add(next)
    const page = await fetchPage(next)
    if (page.nextCursor && (page.nextCursor === next || visited.has(page.nextCursor))) throw new Error('History cursor did not advance')
    for (const message of page.messages) messages.set(message.id, message)
    const found = page.messages.some(message => knownIds.has(message.id))
    if ((!knownIds.size && !scanToEnd) || found || !page.nextCursor) return { messages: [...messages.values()], nextCursor: page.nextCursor, status: !knownIds.size || found ? 'complete' : 'changed' }
    next = page.nextCursor
  }
  return { messages: [...messages.values()], nextCursor: next ?? null, status: 'partial' }
}
