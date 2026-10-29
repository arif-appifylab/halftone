import { Link } from 'react-router-dom'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-medium tracking-[-0.01em] ' +
  'transition-[background-color,box-shadow,color,transform] duration-200 ease-expo active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base ' +
  'disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-accent-bright to-accent text-accent-ink shadow-accent hover:shadow-accent-hover hover:from-[#e6ff8f] hover:to-accent-bright',
  secondary: 'bg-white/[0.05] text-fg backdrop-blur-md shadow-inset hover:bg-white/[0.08] hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1),0_0_0_1px_rgb(255_255_255/0.1),0_0_24px_rgb(255_255_255/0.04)]',
  ghost: 'text-muted hover:bg-white/[0.05] hover:text-fg',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-[13px]',
  md: 'h-10 rounded-lg px-4 text-sm',
  lg: 'h-12 rounded-xl px-6 text-[15px]',
}

/** Diagonal light sweep that crosses primary buttons on hover. */
function Shine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-expo group-hover:translate-x-full group-hover:opacity-100"
    />
  )
}

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode }

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {variant === 'primary' && <Shine />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  )
}

/** Same visual API as Button, rendered as a router link or external anchor. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & { to: string } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>) {
  const classes = cn(base, variants[variant], sizes[size], className)
  const inner = (
    <>
      {variant === 'primary' && <Shine />}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </>
  )
  if (/^(https?:|tel:|mailto:)/.test(to)) {
    return (
      <a href={to} className={classes} {...props}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} {...props}>
      {inner}
    </Link>
  )
}
