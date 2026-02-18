import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { classNames } from '@/shared/utils/classNames'
import './Button.css'

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
  return (
    <button
      className={classNames('button-base', `button-${variant}`, className)}
      type={type}
      {...restProps}
    >
      {children}
    </button>
  )
}
