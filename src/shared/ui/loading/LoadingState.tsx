import { classNames } from '@/shared/utils/classNames'

interface LoadingStateProps {
  readonly label?: string
  readonly size?: 'sm' | 'md' | 'lg'
  readonly variant?: 'page' | 'section'
}

export function LoadingState({
  label = 'Loading...',
  size = 'md',
  variant = 'section',
}: LoadingStateProps) {
  const containerClass =
    variant === 'page'
      ? 'min-h-[60vh] w-full rounded-2xl border border-slate-200 bg-white'
      : 'min-h-[160px] w-full rounded-xl border border-slate-200 bg-white'

  const spinnerClass =
    size === 'sm'
      ? 'h-5 w-5 border-2'
      : size === 'lg'
        ? 'h-10 w-10 border-[3px]'
        : 'h-7 w-7 border-2'

  return (
    <div
      className={classNames(
        'flex items-center justify-center gap-3 p-6 text-slate-600',
        containerClass,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={classNames(
          'inline-block animate-spin rounded-full border-slate-300 border-t-lime-500',
          spinnerClass,
        )}
      />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  )
}
