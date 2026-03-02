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
      ? 'bg-tc-action-primary text-tc-action-primaryText hover:bg-tc-action-primaryHover focus-visible:ring-tc-action-primaryRing'
      : variant === 'secondary'
      ? 'bg-white text-tc-action-secondaryText ring-1 ring-tc-action-secondaryRing hover:bg-slate-50 focus-visible:ring-tc-action-secondaryRing'
      : variant === 'highlight'
      ? 'rounded-[5px] bg-tc-action-primary text-[#121212] outline outline-[2px] outline-tc-action-primary outline-offset-[4px] ring-0 hover:bg-[#94FF96] focus-visible:ring-[#94FF96]'
      : variant === 'danger'
      ? 'bg-[#F43F5E] text-white ring-1 ring-tc-action-secondaryRing hover:bg-[#E11D48] focus-visible:ring-tc-action-secondaryRing'
      : 'bg-[#F8F8F9] text-[#121212] hover:bg-slate-90'

  return (
    <button
      className={classNames(
        'inline-flex items-center tracking-wide justify-center gap-2 rounded-xl px-4 py-3 text-md font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
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
