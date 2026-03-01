import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { classNames } from '@/shared/utils/classNames'

export interface CustomSelectOption {
  readonly value: string
  readonly label: string
}

export interface CustomSelectProps {
  readonly id?: string
  readonly value: string
  readonly options: readonly CustomSelectOption[]
  readonly onChange: (value: string) => void
  readonly placeholder?: string
  readonly buttonClassName?: string
  readonly menuClassName?: string
  readonly disabled?: boolean
}

const defaultButtonClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none'

export function CustomSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select',
  buttonClassName,
  menuClassName,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const displayLabel =
    selectedOption?.label.trim() ||
    selectedOption?.value.trim() ||
    value.trim() ||
    placeholder
  const showsPlaceholder = displayLabel === placeholder

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={classNames(
          defaultButtonClassName,
          'flex items-center justify-between text-left transition disabled:cursor-not-allowed disabled:opacity-60',
          isOpen && 'border-lime-400 ring-4 ring-lime-100',
          buttonClassName,
        )}
        onClick={() => {
          if (disabled) {
            return
          }
          setIsOpen((current) => !current)
        }}
      >
        <span className={showsPlaceholder ? 'text-slate-400' : ''}>{displayLabel}</span>
        <ChevronDown
          size={18}
          className={classNames('text-slate-500 transition', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className={classNames(
            'absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg',
            menuClassName,
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={classNames(
                'w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                value === option.value && 'bg-lime-50 font-semibold text-lime-700',
              )}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
