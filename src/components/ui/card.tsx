"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
// import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { cardHoverVariants } from "@/components/animations/micro-interactions"

const cardVariants = cva(
  "relative rounded-xl border bg-card text-card-foreground transition-all duration-200 overflow-hidden transform-gpu",
  {
    variants: {
      variant: {
        // Default card with subtle elevation
        default: [
          "border-border shadow-elevation-1",
          "hover:shadow-elevation-2 hover:scale-[1.01] hover:-translate-y-1",
          "active:shadow-elevation-1 active:scale-[0.99] active:translate-y-0"
        ],
        
        // Elevated card with more prominent shadow
        elevated: [
          "border-border shadow-elevation-2",
          "hover:shadow-elevation-3 hover:scale-[1.02] hover:-translate-y-1",
          "active:shadow-elevation-2 active:scale-[0.99] active:translate-y-0"
        ],
        
        // Interactive card with glow effect
        interactive: [
          "border-border shadow-elevation-1 cursor-pointer",
          "hover:shadow-elevation-3 hover:scale-[1.02] hover:border-primary-300 hover:-translate-y-1",
          "hover:shadow-primary/10",
          "active:shadow-elevation-2 active:scale-[0.99] active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ],
        
        // Glass morphism card
        glass: [
          "glass border-glass-border shadow-glass-shadow backdrop-blur-xl",
          "hover:shadow-elevation-3 hover:scale-[1.01] hover:-translate-y-1",
          "active:shadow-elevation-2 active:scale-[0.99] active:translate-y-0"
        ],
        
        // Flat card without shadow
        flat: [
          "border-border",
          "hover:bg-accent/50 hover:border-primary-200",
          "active:bg-accent/80"
        ],
        
        // Premium card with gradient border
        premium: [
          "border-2 border-transparent bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20 p-[1px]",
          "shadow-elevation-2",
          "hover:shadow-elevation-3 hover:scale-[1.01] hover:from-primary-500/30 hover:to-primary-500/30 hover:-translate-y-1",
          "active:shadow-elevation-2 active:scale-[0.99] active:translate-y-0",
          "before:absolute before:inset-[1px] before:rounded-[11px] before:bg-card before:z-[-1]"
        ]
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  interactive?: boolean
  animate?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, animate = true, children, ...props }, ref) => {
    if (!animate) {
      return (
        <div
          ref={ref}
          className={cn(cardVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("flex flex-col space-y-2", className)} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-card-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("pt-4", className)} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }