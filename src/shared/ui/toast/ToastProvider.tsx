import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { classNames } from '@/shared/utils/classNames'
import { ToastContext, type ShowToastOptions, type ToastTone } from './context'

interface ToastItem {
  readonly id: number
  readonly title: string
  readonly message: string
  readonly tone: ToastTone
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => number
  dismissToast: (id: number) => void
  clearToasts: () => void
}

const maxVisibleToasts = 3
const defaultDurationMs = 3400

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)
  const timeoutByIdRef = useRef<Map<number, number>>(new Map())

  const clearDismissTimeout = useCallback((id: number) => {
    const timeoutId = timeoutByIdRef.current.get(id)
    if (timeoutId === undefined) {
      return
    }

    window.clearTimeout(timeoutId)
    timeoutByIdRef.current.delete(id)
  }, [])

  const dismissToast = useCallback(
    (id: number) => {
      clearDismissTimeout(id)
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    },
    [clearDismissTimeout],
  )

  const scheduleAutoDismiss = useCallback(
    (id: number, durationMs: number) => {
      const timeoutId = window.setTimeout(() => {
        dismissToast(id)
      }, durationMs)

      timeoutByIdRef.current.set(id, timeoutId)
    },
    [dismissToast],
  )

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const id = toastIdRef.current + 1
      toastIdRef.current = id

      const nextToast: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        tone: options.tone ?? 'info',
      }

      let hiddenToastIds: number[] = []
      setToasts((currentToasts) => {
        const nextToasts = [...currentToasts, nextToast]
        const overflowCount = nextToasts.length - maxVisibleToasts
        if (overflowCount <= 0) {
          return nextToasts
        }

        hiddenToastIds = nextToasts
          .slice(0, overflowCount)
          .map((overflowToast) => overflowToast.id)
        return nextToasts.slice(overflowCount)
      })

      hiddenToastIds.forEach(clearDismissTimeout)
      scheduleAutoDismiss(id, options.durationMs ?? defaultDurationMs)
      return id
    },
    [clearDismissTimeout, scheduleAutoDismiss],
  )

  const clearToasts = useCallback(() => {
    timeoutByIdRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    timeoutByIdRef.current.clear()
    setToasts([])
  }, [])

  useEffect(() => {
    const timeoutById = timeoutByIdRef.current
    return () => {
      timeoutById.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutById.clear()
    }
  }, [])

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
      clearToasts,
    }),
    [showToast, dismissToast, clearToasts],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-5 top-5 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast, index) => {
          const resolvedTone = toast.tone === 'error' ? 'danger' : toast.tone

          return (
            <article
              key={toast.id}
              className={classNames(
                'pointer-events-auto relative overflow-hidden rounded-xl border bg-tc-shell-bg px-4 py-3 text-sm shadow-[0_16px_35px_rgba(0,0,0,0.24)] backdrop-blur-sm animate-[pulse_0.55s_ease-out_1]',
                index % 2 === 0 ? 'rotate-[0.35deg]' : '-rotate-[0.35deg]',
                resolvedTone === 'success' && 'border-tc-shell-accent text-tc-shell-accent',
                resolvedTone === 'warning' && 'border-tc-shell-notify text-tc-shell-notify',
                resolvedTone === 'danger' && 'border-tc-shell-danger text-tc-shell-danger',
                resolvedTone === 'info' && 'border-slate-100 text-slate-100',
              )}
            >
              <span className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/10 blur-xl" />
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-1 text-xs/5 text-current/90">{toast.message}</p>
              <button
                className="mt-2 rounded-md border border-current/35 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.05em] text-current/90 hover:bg-white/10"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                Dismiss
              </button>
            </article>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
