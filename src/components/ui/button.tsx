import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-fg))] hover:opacity-90 shadow-md shadow-orange-200 dark:shadow-orange-900/30 focus-visible:ring-[hsl(var(--ring))]',
        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-fg))] hover:opacity-90 focus-visible:ring-[hsl(var(--destructive))]',
        outline:
          'border-2 border-[hsl(var(--border))] bg-transparent text-[hsl(var(--fg))] hover:bg-[hsl(var(--secondary))] focus-visible:ring-[hsl(var(--ring))]',
        secondary:
          'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-fg))] hover:opacity-80 focus-visible:ring-[hsl(var(--ring))]',
        ghost:
          'hover:bg-[hsl(var(--secondary))] text-[hsl(var(--fg))] focus-visible:ring-[hsl(var(--ring))]',
        link: 'text-[hsl(var(--primary))] underline-offset-4 hover:underline focus-visible:ring-[hsl(var(--ring))]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-13 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
