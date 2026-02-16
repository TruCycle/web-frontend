export interface Message {
  readonly id: string
  readonly author: string
  readonly body: string
  readonly sentAt: string
  readonly status: 'pending' | 'sent' | 'failed'
}
