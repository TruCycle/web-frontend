import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { classNames } from '@/shared/utils/classNames'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  readonly variant?: ButtonVariant
}

export function Button({
  children,
  className,
  variant = 'primary',
  type = 'button',
  ...restProps
}: ButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-tc-action-primary text-tc-action-primaryText hover:bg-tc-action-primaryHover focus-visible:ring-tc-action-primaryRing'
      : 'bg-white text-tc-action-secondaryText ring-1 ring-tc-action-secondaryRing hover:bg-slate-50 focus-visible:ring-tc-action-secondaryRing'

  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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
