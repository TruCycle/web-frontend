import './LoadingState.css'

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
  return (
    <div
      className={`loading-state loading-state-${variant}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={`loading-spinner loading-spinner-${size}`} />
      {label ? <span className="loading-label">{label}</span> : null}
    </div>
  )
}
