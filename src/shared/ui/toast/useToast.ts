import { useContext } from 'react'
import { ToastContext, type ShowToastOptions } from './context'

export function useToast() {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const success = (title: string, message: string, durationMs?: number) =>
    context.showToast({ title, message, tone: 'success', durationMs })

  const info = (title: string, message: string, durationMs?: number) =>
    context.showToast({ title, message, tone: 'info', durationMs })

  const error = (title: string, message: string, durationMs?: number) =>
    context.showToast({ title, message, tone: 'error', durationMs })

  const show = (options: ShowToastOptions) => context.showToast(options)

  return {
    show,
    success,
    info,
    error,
    dismissToast: context.dismissToast,
    clearToasts: context.clearToasts,
  }
}
