import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const control =
  'w-full rounded-lg border border-white/10 bg-field px-3.5 text-sm text-fg placeholder:text-muted/70 ' +
  'shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)] transition-[border-color,box-shadow] duration-200 ease-expo ' +
  'hover:border-white/15 focus:border-accent/70 focus:outline-none focus:ring-4 focus:ring-accent/15'

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className="flex items-baseline justify-between text-[13px] font-medium text-fg/90">
        {label}
        {hint && <span className="font-mono text-[11px] font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={cn(control, 'min-h-32 resize-y py-3 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<'select'>) {
  return (
    <select className={cn(control, 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27none%27%20stroke%3D%27%238b93a1%27%20stroke-width%3D%271.5%27%3E%3Cpath%20d%3D%27m3%204.5%203%203%203-3%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10', className)} {...props}>
      {children}
    </select>
  )
}
