import { apiRequest } from '@/shared/lib/api/client'
import type { Message } from '../types'

const fallbackMessages: Message[] = [
  {
    id: 'seed-message-1',
    author: 'System',
    body: 'Messaging API is not connected yet. This is placeholder data.',
    sentAt: '2026-02-16T00:00:00.000Z',
    status: 'sent',
  },
]

export async function fetchMessages(): Promise<Message[]> {
  try {
    return await apiRequest<Message[]>('/messages')
  } catch {
    return fallbackMessages
  }
}
