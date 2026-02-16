import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMessages } from '@/features/messaging/api/messagingApi'
import type { Message } from '@/features/messaging/types'
import { env } from '@/shared/lib/config/env'
import { WebSocketClient } from '@/shared/lib/websocket/client'

function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<Message>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.author === 'string' &&
    typeof candidate.body === 'string' &&
    typeof candidate.sentAt === 'string' &&
    (candidate.status === 'pending' ||
      candidate.status === 'sent' ||
      candidate.status === 'failed')
  )
}

function parseIncomingMessage(payload: string): Message | null {
  try {
    const parsed = JSON.parse(payload) as unknown
    return isMessage(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const websocketClient = useMemo(() => {
    if (!env.websocketUrl) {
      return null
    }

    const normalized = env.websocketUrl.replace(/\/$/, '')
    return new WebSocketClient(`${normalized}/messages`)
  }, [])

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchMessages()
      setMessages(response)
    } catch {
      setError('Unable to load messages right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!websocketClient) {
      return
    }

    const unsubscribe = websocketClient.subscribe((payload) => {
      const incomingMessage = parseIncomingMessage(payload)
      if (!incomingMessage) {
        return
      }

      setMessages((currentMessages) => [incomingMessage, ...currentMessages])
    })

    websocketClient.connect()

    return () => {
      unsubscribe()
      websocketClient.disconnect()
    }
  }, [websocketClient])

  return { messages, isLoading, error, reload: loadMessages }
}
