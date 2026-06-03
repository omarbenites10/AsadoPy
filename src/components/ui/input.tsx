import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input-bg))] px-3.5 py-2 text-sm text-[hsl(var(--fg))] transition-colors placeholder:text-[hsl(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
