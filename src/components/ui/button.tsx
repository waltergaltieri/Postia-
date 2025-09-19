'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
// import { motion } from "framer-motion"
// import type { HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonHoverVariants, LoadingSpinner } from "@/components/animations"
import { announceToScreenReader, useReducedMotion } from "@/lib/accessibility"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden transform-gpu touch-target interactive-element",
  {
    variants: {
      variant: {
        // Premium primary with gradient and glow
        default: [
          "bg-gradient-primary text-white shadow-elevation-2 btn-primary-hover btn-hover-enhanced",
          "hover:shadow-elevation-3 hover:shadow-primary/20 hover:scale-[1.02]",
          "active:shadow-elevation-1 active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0",
          "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500"
        ],

        // Premium secondary with subtle elevation
        secondary: [
          "bg-secondary text-secondary-foreground border border-border shadow-elevation-1 btn-secondary-hover",
          "hover:bg-accent hover:text-accent-foreground hover:shadow-elevation-2 hover:scale-[1.01]",
          "active:shadow-none active:scale-[0.99]"
        ],

        // Destructive with error styling
        destructive: [
          "bg-error-500 text-white shadow-elevation-2 hover-glow-error",
          "hover:bg-error-600 hover:shadow-elevation-3 hover:shadow-error-500/20 hover:scale-[1.02]",
          "active:bg-error-700 active:shadow-elevation-1 active:scale-[0.98]"
        ],

        // Success variant with success colors
        success: [
          "bg-success-500 text-white shadow-elevation-2 hover-glow-success",
          "hover:bg-success-600 hover:shadow-elevation-3 hover:shadow-success-500/20 hover:scale-[1.02]",
          "active:bg-success-700 active:shadow-elevation-1 active:scale-[0.98]"
        ],

        // Outline with premium border
        outline: [
          "border-2 border-border bg-background text-foreground shadow-elevation-1 hover-normal",
          "hover:bg-accent hover:text-accent-foreground hover:border-primary-300 hover:shadow-elevation-2 hover:scale-[1.01]",
          "active:shadow-none active:scale-[0.99]"
        ],

        // Ghost with subtle hover
        ghost: [
          "text-foreground btn-ghost-hover",
          "hover:bg-accent hover:text-accent-foreground hover:scale-[1.01]",
          "active:bg-accent/80 active:scale-[0.99]"
        ],

        // Link style
        link: [
          "text-primary-600 underline-offset-4 link-hover",
          "hover:underline hover:text-primary-700",
          "active:text-primary-800"
        ],

        // Premium gradient variant
        premium: [
          "bg-gradient-premium text-white shadow-elevation-3 hover-prominent btn-hover-enhanced",
          "hover:shadow-elevation-4 hover:shadow-primary/30 hover:scale-[1.02]",
          "active:shadow-elevation-2 active:scale-[0.98]",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0",
          "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500"
        ]
      },
      size: {
        sm: "h-9 spacing-px-sm text-xs rounded-md min-w-[44px]", // Ensure minimum touch target
        default: "h-10 spacing-px-md spacing-py-sm min-w-[44px]",
        lg: "h-12 spacing-px-lg text-base rounded-xl min-w-[48px]",
        xl: "h-14 spacing-px-xl text-lg rounded-xl min-w-[56px]",
        icon: "h-10 w-10 min-w-[44px] min-h-[44px]", // WCAG AA touch target
        "icon-sm": "h-9 w-9 min-w-[44px] min-h-[44px]",
        "icon-lg": "h-12 w-12 min-w-[48px] min-h-[48px]"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  animate?: boolean
  selected?: boolean
  // Accessibility props
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-expanded"?: boolean
  "aria-pressed"?: boolean
  "aria-controls"?: string
  announceOnClick?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    icon,
    rightIcon,
    children,
    disabled,
    animate = true,
    selected = false,
    announceOnClick,
    onClick,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading
    // Fallback implementation to handle potential import issues
    let prefersReducedMotion = false
    try {
      const { prefersReducedMotion: reducedMotion } = useReducedMotion()
      prefersReducedMotion = reducedMotion
    } catch (error) {
      console.warn('useReducedMotion failed, using fallback:', error)
      prefersReducedMotion = false
    }
    const shouldAnimate = animate && !prefersReducedMotion

    // Enhanced click handler with accessibility announcements
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (announceOnClick) {
        announceToScreenReader(announceOnClick)
      }
      onClick?.(event)
    }, [onClick, announceOnClick])

    // Keyboard navigation handler
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (onClick) {
          const syntheticEvent = new MouseEvent('click', { bubbles: true }) as any
          handleClick(syntheticEvent)
        }
      }
    }, [isDisabled, onClick, handleClick])

    const content = loading ? (
      <>
        <LoadingSpinner className="mr-2" aria-hidden="true" />
        <span>{loadingText || children}</span>
        <span className="sr-only">Cargando...</span>
      </>
    ) : (
      <>
        {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
      </>
    )

    // Enhanced className with state classes
    const enhancedClassName = cn(
      buttonVariants({ variant, size, className }),
      {
        'btn-loading': loading,
        'btn-disabled': isDisabled && !loading,
        'disabled-enhanced': isDisabled && !loading,
        'selected': selected,
        'interactive-selected': selected
      }
    )

    // Common accessibility props
    const accessibilityProps = {
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      'aria-selected': selected,
      tabIndex: isDisabled ? -1 : 0,
      ...props
    }

    if (asChild) {
      return (
        <Slot
          className={enhancedClassName}
          ref={ref}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...accessibilityProps}
        >
          {content}
        </Slot>
      )
    }

    if (!shouldAnimate) {
      return (
        <button
          className={enhancedClassName}
          ref={ref}
          disabled={isDisabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          {...accessibilityProps}
        >
          {content}
        </button>
      )
    }

    return (
      <button
        className={enhancedClassName}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }