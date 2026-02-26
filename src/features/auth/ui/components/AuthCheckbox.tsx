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
        'inline-flex cursor-pointer items-center gap-[0.55rem]',
        disabled && 'cursor-not-allowed opacity-70',
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
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.35rem] border border-tc-auth-inputBorder bg-white transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tc-auth-inputFocus peer-checked:border-tc-auth-submit peer-checked:bg-tc-auth-submit peer-disabled:border-slate-200 peer-disabled:bg-slate-100">
        <svg
          aria-hidden
          className="h-3.5 w-3.5 opacity-0 transition-opacity peer-checked:opacity-100"
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
