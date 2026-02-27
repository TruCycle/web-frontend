import { createContext } from 'react'

export type ToastTone = 'success' | 'info' | 'error'

export interface ShowToastOptions {
  readonly title: string
  readonly message: string
  readonly tone?: ToastTone
  readonly durationMs?: number
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => number
  dismissToast: (id: number) => void
  clearToasts: () => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
