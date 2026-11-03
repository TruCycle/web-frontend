import { io, type Socket } from 'socket.io-client'
import { getStoredSession } from '@/shared/lib/auth/session'
import { apiRequest } from '@/shared/lib/api/client'
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
  private ownerId: string | null = null
  private version = 0
  private recoveryAttempts = 0
  private recovering = false
  private authenticated = false
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null
  private readonly listeners = new Map<string, Map<unknown, (...args: never[]) => void>>()

  constructor(options: SocketClientOptions) {
    this.options = options
  }

  connect(): void {
    if (this.socket) {
      return
    }

    try { this.ownerId = getStoredSession()?.user.id ?? null } catch { return }
    const token = this.readToken()
    if (!token) return

    const baseUrl = resolveSocketBaseUrl()
    this.socket = io(`${baseUrl ?? ''}${this.options.namespace}`, {
      // Read the latest same-account credential for every transport reconnect.
      auth: (callback) => callback({ token: this.readToken() ?? '' }),
      transports: ['websocket', 'polling'],
      tryAllTransports: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: this.options.reconnectDelayMs ?? 1500,
      reconnectionAttempts: this.options.maxReconnectAttempts ?? 8,
    })

    const socket = this.socket
    const version = ++this.version
    this.recoveryAttempts = 0
    // Internal lifecycle events are independent of the feature's event map.
    const lifecycle = socket as unknown as Socket
    lifecycle.on('auth:ready', () => {
      if (this.isCurrent(socket, version)) { this.authenticated = true; this.recoveryAttempts = 0 }
    })
    lifecycle.on('disconnect', (reason) => {
      if (this.socket !== socket || this.version !== version) return
      this.authenticated = false
      if (reason === 'io server disconnect') this.scheduleRecovery(socket, version)
    })
    socket.connect()
  }

  disconnect(): void {
    this.version++
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer)
    this.recoveryTimer = null
    this.recovering = false
    this.authenticated = false
    const socket = this.socket
    this.socket = null
    this.ownerId = null
    this.listeners.clear()
    socket?.disconnect()
  }

  private readToken(): string | null {
    try {
      const session = getStoredSession()
      return session?.user.id === this.ownerId ? session.tokens.accessToken : null
    } catch { return null }
  }

  private isCurrent(socket: Socket<TServerEvents, TClientEvents>, version: number): boolean {
    return this.socket === socket && this.version === version && this.readToken() !== null
  }

  private scheduleRecovery(socket: Socket<TServerEvents, TClientEvents>, version: number): void {
    if (!this.isCurrent(socket, version) || this.recovering || this.recoveryTimer ||
        this.recoveryAttempts >= (this.options.maxReconnectAttempts ?? 8)) return
    const attempt = this.recoveryAttempts++
    this.recoveryTimer = setTimeout(() => {
      this.recoveryTimer = null
      if (!this.isCurrent(socket, version)) return
      this.recovering = true
      // A GET uses the existing single-flight session recovery and current-account
      // check. No message or other mutation is replayed as part of reconnect.
      void apiRequest('/auth/me').then(() => {
        if (this.version === version) this.recovering = false
        if (this.isCurrent(socket, version)) socket.connect()
      }).catch(() => {
        if (this.isCurrent(socket, version)) {
          this.recovering = false
          this.scheduleRecovery(socket, version)
        }
      }).finally(() => { if (this.version === version) this.recovering = false })
    }, Math.min((this.options.reconnectDelayMs ?? 1500) * 2 ** attempt, 30_000))
  }

  on<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener: TServerEvents[TEventName],
  ): void {
    this.listen(eventName, listener, false)
  }

  once<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener: TServerEvents[TEventName],
  ): void {
    this.listen(eventName, listener, true)
  }

  off<TEventName extends keyof TServerEvents & string>(
    eventName: TEventName,
    listener?: TServerEvents[TEventName],
  ): void {
    const registered = this.listeners.get(eventName)
    if (listener) {
      const wrapped = registered?.get(listener)
      if (wrapped) this.socket?.off(eventName, wrapped as never)
      registered?.delete(listener)
    } else {
      for (const wrapped of registered?.values() ?? []) this.socket?.off(eventName, wrapped as never)
      this.listeners.delete(eventName)
    }
  }

  private listen<TEventName extends keyof TServerEvents & string>(eventName: TEventName, listener: TServerEvents[TEventName], once: boolean): void {
    const socket = this.socket
    if (!socket) return
    this.off(eventName, listener)
    const version = this.version
    const wrapped = (...args: never[]) => {
      if (once && this.listeners.get(eventName)?.get(listener) === wrapped) this.listeners.get(eventName)?.delete(listener)
      if (this.isCurrent(socket, version)) listener(...args)
    }
    let registered = this.listeners.get(eventName)
    if (!registered) { registered = new Map(); this.listeners.set(eventName, registered) }
    registered.set(listener, wrapped)
    if (once) socket.once(eventName, wrapped as never)
    else socket.on(eventName, wrapped as never)
  }

  emit<TEventName extends keyof TClientEvents & string>(
    eventName: TEventName,
    ...args: Parameters<TClientEvents[TEventName]>
  ): boolean {
    // Socket.IO otherwise buffers disconnected emits and replays them later.
    if (!this.authenticated || !this.socket?.connected || !this.readToken()) return false
    this.socket.emit(eventName, ...args)
    return true
  }

  get isConnected(): boolean {
    return Boolean(this.authenticated && this.socket?.connected && this.readToken())
  }
}
