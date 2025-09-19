import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 interactive-element",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 badge-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 badge-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 badge-hover hover-glow-error",
        outline: "text-foreground badge-hover hover-subtle",
        success:
          "border-transparent bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400 badge-hover hover-glow-success",
        warning:
          "border-transparent bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400 badge-hover hover-glow-warning",
        info:
          "border-transparent bg-info-100 text-info-800 dark:bg-info-900/20 dark:text-info-400 badge-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  selected?: boolean
  disabled?: boolean
  loading?: boolean
  interactive?: boolean
}

function Badge({ className, variant, selected, disabled, loading, interactive, ...props }: BadgeProps) {
  // Enhanced className with state classes
  const enhancedClassName = cn(
    badgeVariants({ variant }),
    {
      'badge-selected': selected,
      'disabled-enhanced': disabled,
      'loading': loading,
      'interactive-selected': selected && interactive,
      'interactive-disabled': disabled && interactive,
      'interactive-loading': loading && interactive
    },
    className
  )

  // Enhanced accessibility props
  const accessibilityProps = {
    'aria-selected': selected,
    'aria-disabled': disabled,
    'aria-busy': loading,
    tabIndex: interactive && !disabled && !loading ? 0 : undefined,
    role: interactive ? 'button' : undefined,
    ...props
  }

  return (
    <div className={enhancedClassName} {...accessibilityProps} />
  )
}

export { Badge, badgeVariants }