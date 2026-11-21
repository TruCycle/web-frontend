import type { ChangeEvent, ReactNode } from 'react'
import { classNames } from '@/shared/utils/classNames'

interface AuthCheckboxProps {
  readonly checked: boolean
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly name: string
  readonly label: ReactNode
  readonly id?: string
  readonly disabled?: boolean
  readonly className?: string
}

export function AuthCheckbox({
  checked,
  onChange,
  name,
  label,
  id,
  disabled = false,
  className,
}: AuthCheckboxProps) {
  return (
    <label
      className={classNames(
        'inline-flex min-h-11 cursor-pointer items-center gap-2',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      htmlFor={id}
    >
      <input
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        id={id}
        name={name}
        onChange={onChange}
        type="checkbox"
      />
      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border border-tc-brand-control bg-white transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tc-brand-deep peer-checked:border-tc-brand-deep peer-checked:bg-tc-brand-deep peer-checked:[&>svg]:opacity-100 peer-disabled:border-tc-brand-line peer-disabled:bg-tc-brand-soft">
        <svg
          aria-hidden
          className="h-3 w-3 opacity-0 transition-opacity"
          viewBox="0 0 20 20"
        >
          <path
            d="M5 10.5L8.4 14L15 7.5"
            fill="none"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  )
}
