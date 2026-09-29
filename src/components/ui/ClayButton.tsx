import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined }
type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string }

export type ClayButtonProps = AsButton | AsLink

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-paytm-blue text-white [box-shadow:var(--clay-shadow-blue)] hover:bg-paytm-blue-800',
  accent:
    'bg-paytm-cyan text-paytm-blue [box-shadow:var(--clay-shadow-cyan)] hover:bg-[#14c3f5]',
  secondary:
    'bg-white text-paytm-blue [box-shadow:var(--clay-shadow-soft)] hover:[box-shadow:var(--clay-shadow-raised)]',
  ghost: 'bg-transparent text-paytm-blue hover:bg-mist',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm gap-1.5',
  md: 'h-12 px-6 text-[15px] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5',
}

/**
 * Tactile clay button. Renders a real <button>, or an <a> when given `href`,
 * so semantics always match behaviour.
 */
export function ClayButton(props: ClayButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    fullWidth,
    children,
    className,
    ...rest
  } = props

  const classes = cn(
    'clay-button inline-flex select-none items-center justify-center font-semibold whitespace-nowrap',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className,
  )

  const content = (
    <>
      {leadingIcon && <span className="-ml-0.5 inline-flex shrink-0" aria-hidden>{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className="-mr-0.5 inline-flex shrink-0" aria-hidden>{trailingIcon}</span>}
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    )
  }

  const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={classes} {...buttonRest}>
      {content}
    </button>
  )
}
