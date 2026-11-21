import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { classNames } from '@/shared/utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'highlight' | 'danger'

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  readonly variant?: ButtonVariant
}

export function Button({
  children,
  className,
  variant,
  type = 'button',
  ...restProps
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-tc-brand-deep text-white hover:bg-tc-brand-hover focus-visible:ring-tc-brand-mint'
      : variant === 'secondary'
      ? 'border border-tc-brand-control bg-white text-tc-brand-deep hover:bg-tc-brand-soft focus-visible:ring-tc-brand-mint'
      : variant === 'highlight'
      ? 'bg-tc-brand-mint text-tc-brand-onMint hover:bg-tc-brand-mintHover focus-visible:ring-tc-brand-deep'
      : variant === 'danger'
      ? 'border border-tc-brand-dangerLine bg-white text-tc-brand-danger hover:bg-tc-brand-dangerSoft focus-visible:ring-tc-brand-dangerLine'
      : 'bg-tc-brand-soft text-tc-brand-deep hover:bg-tc-brand-line focus-visible:ring-tc-brand-mint'

  return (
    <button
      className={classNames(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-tc-md px-4 py-3 text-sm leading-5 font-semibold transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses,
        className,
      )}
      type={type}
      {...restProps}
    >
      {children}
    </button>
  )
}
