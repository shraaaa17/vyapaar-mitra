import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '../../lib/cn'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

export type SegmentedChoiceProps<T extends string> = {
  /** Accessible group name, e.g. "Marketing offers". */
  legend: string
  hideLegend?: boolean
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  describedBy?: string
  className?: string
}

/**
 * A row of mutually exclusive choices built on native radio buttons, so arrow
 * keys, form semantics and screen readers behave as users expect.
 */
export function SegmentedChoice<T extends string>({
  legend,
  hideLegend,
  value,
  options,
  onChange,
  disabled,
  describedBy,
  className,
}: SegmentedChoiceProps<T>) {
  const name = useId()
  return (
    <fieldset className={cn('min-w-0', className)} disabled={disabled} aria-describedby={describedBy}>
      <legend className={cn(hideLegend ? 'sr-only' : 'mb-2 text-sm font-semibold text-paytm-blue')}>{legend}</legend>
      <div
        className="clay-inset grid gap-1 rounded-[20px] p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-2 py-2 text-center text-sm leading-tight font-semibold transition-all duration-200',
                'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paytm-cyan',
                checked
                  ? 'bg-white text-paytm-blue [box-shadow:var(--clay-shadow-soft)]'
                  : 'text-slate hover:text-paytm-blue',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon && (
                <span aria-hidden className="inline-flex shrink-0 [&_svg]:size-4">
                  {option.icon}
                </span>
              )}
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
