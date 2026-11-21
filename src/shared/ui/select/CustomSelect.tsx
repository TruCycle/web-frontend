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
  'h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none'

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
          'flex items-center justify-between gap-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-tc-brand-deep ring-2 ring-tc-brand-mint',
          buttonClassName,
        )}
        onClick={() => {
          if (disabled) {
            return
          }
          setIsOpen((current) => !current)
        }}
      >
        <span className={showsPlaceholder ? 'text-tc-brand-muted' : ''}>{displayLabel}</span>
        <ChevronDown
          size={18}
          className={classNames('shrink-0 text-tc-brand-muted transition', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className={classNames(
            'absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-tc-md border border-tc-brand-line bg-white p-1 shadow-tc-raised',
            menuClassName,
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={classNames(
                'min-h-11 w-full rounded-tc-sm px-3 py-2 text-left text-sm text-tc-brand-ink hover:bg-tc-brand-soft',
                value === option.value && 'bg-tc-brand-mintSoft font-semibold text-tc-brand-deep',
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
