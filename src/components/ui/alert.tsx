'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-red-50 border-red-200",
        warning:
          "border-yellow-500/50 text-yellow-800 dark:border-yellow-500 [&>svg]:text-yellow-600 bg-yellow-50 border-yellow-200",
        success:
          "border-green-500/50 text-green-800 dark:border-green-500 [&>svg]:text-green-600 bg-green-50 border-green-200",
        info:
          "border-blue-500/50 text-blue-800 dark:border-blue-500 [&>svg]:text-blue-600 bg-blue-50 border-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "info":
        return <Info className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {getIcon()}
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }