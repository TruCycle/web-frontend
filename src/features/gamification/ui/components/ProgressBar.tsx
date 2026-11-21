interface ProgressBarProps {
  readonly value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-tc-brand-track">
      <div
        className="h-full rounded-full bg-tc-brand-deep transition-[width] duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
