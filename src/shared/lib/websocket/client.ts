type MessageListener = (payload: string) => void

interface WebSocketClientOptions {
  readonly reconnectDelayMs?: number
  readonly maxReconnectAttempts?: number
}

export class WebSocketClient {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimeoutId: number | undefined
  private readonly messageListeners = new Set<MessageListener>()
  private readonly url: string
  private readonly options: WebSocketClientOptions

  constructor(url: string, options: WebSocketClientOptions = {}) {
    this.url = url
    this.options = options
  }

  connect(): void {
    if (!this.url || this.socket) {
      return
    }

    this.socket = new WebSocket(this.url)
    this.socket.addEventListener('open', this.handleOpen)
    this.socket.addEventListener('message', this.handleMessage)
    this.socket.addEventListener('close', this.handleClose)
    this.socket.addEventListener('error', this.handleError)
  }

  disconnect(): void {
    this.clearReconnectTimeout()

    if (!this.socket) {
      return
    }

    this.socket.removeEventListener('open', this.handleOpen)
    this.socket.removeEventListener('message', this.handleMessage)
    this.socket.removeEventListener('close', this.handleClose)
    this.socket.removeEventListener('error', this.handleError)
    this.socket.close()
    this.socket = null
  }

  send(payload: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(payload)
    }
  }

  subscribe(listener: MessageListener): () => void {
    this.messageListeners.add(listener)
    return () => {
      this.messageListeners.delete(listener)
    }
  }

  private handleOpen = (): void => {
    this.reconnectAttempts = 0
  }

  private handleMessage = (event: MessageEvent<string>): void => {
    this.messageListeners.forEach((listener) => listener(event.data))
  }

  private handleClose = (): void => {
    this.socket = null
    const maxReconnectAttempts = this.options.maxReconnectAttempts ?? 5
    if (this.reconnectAttempts >= maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts += 1
    const reconnectDelayMs = this.options.reconnectDelayMs ?? 1500
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect()
    }, reconnectDelayMs)
  }

  private handleError = (): void => {
    this.disconnect()
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId === undefined) {
      return
    }

    window.clearTimeout(this.reconnectTimeoutId)
    this.reconnectTimeoutId = undefined
  }
}
