import { io, type Socket } from 'socket.io-client'
import { getStoredAccessToken } from '@/shared/lib/auth/session'
import { env } from '@/shared/lib/config/env'

type EventMap = Record<string, (...args: never[]) => void>

interface SocketClientOptions {
  readonly namespace: '/messages' | '/notifications'
  readonly reconnectDelayMs?: number
  readonly maxReconnectAttempts?: number
}

function resolveSocketBaseUrl(): string | undefined {
  const wsBase = env.websocketUrl.trim()
  if (wsBase) {
    return wsBase.replace(/\/$/, '')
  }

  const apiBase = env.apiBaseUrl.trim()
  if (!apiBase || apiBase.startsWith('/')) {
    return undefined
  }

  try {
    const parsedUrl = new URL(apiBase)
    if (parsedUrl.pathname === '/api') {
      parsedUrl.pathname = ''
    } else if (parsedUrl.pathname.endsWith('/api')) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -4)
    }
    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return undefined
  }
}

export class WebSocketClient<
  TServerEvents extends EventMap = EventMap,
  TClientEvents extends EventMap = EventMap,
> {
  private socket: Socket<TServerEvents, TClientEvents> | null = null
  private readonly options: SocketClientOptions

  constructor(options: SocketClientOptions) {
    this.options = options
  }

  connect(): void {
    if (this.socket) {
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      return
    }

    const baseUrl = resolveSocketBaseUrl()
    this.socket = io(`${baseUrl ?? ''}${this.options.namespace}`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      tryAllTransports: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: this.options.reconnectDelayMs ?? 1500,
      reconnectionAttempts: this.options.maxReconnectAttempts ?? 8,
    })

    this.socket.connect()
  }

  disconnect(): void {
    if (!this.socket) {
      return
    }

    this.socket.disconnect()
    this.socket = null
  }

  on<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener: TServerEvents[TEventName],
  ): void {
    this.socket?.on(eventName, listener as never)
  }

  once<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener: TServerEvents[TEventName],
  ): void {
    this.socket?.once(eventName, listener as never)
  }

  off<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener?: TServerEvents[TEventName],
  ): void {
    this.socket?.off(eventName, listener as never)
  }

  emit<TEventName extends keyof TClientEvents & string>(
    eventName: TEventName,
    ...args: Parameters<TClientEvents[TEventName]>
  ): void {
    this.socket?.emit(eventName, ...args)
  }

  get isConnected(): boolean {
    return Boolean(this.socket?.connected)
  }
}
