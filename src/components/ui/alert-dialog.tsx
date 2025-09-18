"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle, Info, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

// Alert dialog types
type AlertType = "info" | "success" | "warning" | "error"

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  type?: AlertType
  className?: string
  children: React.ReactNode
}

interface AlertDialogContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  type?: AlertType
  showCloseButton?: boolean
}

interface QuickAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: AlertType
  title: string
  description: string
  actionText?: string
  cancelText?: string
  onAction?: () => void
  onCancel?: () => void
  loading?: boolean
}

// Animation variants
const alertBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.15 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  }
}

const alertContentVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: -10
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.15,
      type: "spring",
      damping: 30,
      stiffness: 400
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: -5,
    transition: { duration: 0.1 }
  }
}

// Type configurations
const alertTypeConfigs: Record<AlertType, { 
  icon: React.ComponentType<{ className?: string }>,
  iconColor: string,
  borderColor: string,
  bgColor: string,
  buttonVariant: "default" | "destructive" | "outline"
}> = {
  info: { 
    icon: Info, 
    iconColor: "text-info-600", 
    borderColor: "border-info-200",
    bgColor: "bg-info-50",
    buttonVariant: "default"
  },
  success: { 
    icon: CheckCircle, 
    iconColor: "text-success-600", 
    borderColor: "border-success-200",
    bgColor: "bg-success-50",
    buttonVariant: "default"
  },
  warning: { 
    icon: AlertCircle, 
    iconColor: "text-warning-600", 
    borderColor: "border-warning-200",
    bgColor: "bg-warning-50",
    buttonVariant: "default"
  },
  error: { 
    icon: AlertTriangle, 
    iconColor: "text-error-600", 
    borderColor: "border-error-200",
    bgColor: "bg-error-50",
    buttonVariant: "destructive"
  }
}

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

// Enhanced overlay with backdrop blur
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    asChild
    {...props}
  >
    <motion.div
      className={cn(
        "fixed inset-0 z-modal bg-neutral-900/30 backdrop-blur-sm",
        className
      )}
      variants={alertBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    />
  </AlertDialogPrimitive.Overlay>
))
AlertDialogOverlay.displayName = "AlertDialogOverlay"

// Enhanced content with premium styling
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, children, type = "info", showCloseButton = false, ...props }, ref) => {
  const typeConfig = alertTypeConfigs[type]
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "fixed left-[50%] top-[50%] z-modal translate-x-[-50%] translate-y-[-50%]",
            "w-full max-w-md bg-background border shadow-2xl",
            "rounded-xl overflow-hidden",
            typeConfig.borderColor,
            className
          )}
          variants={alertContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative">
            {children}
            {showCloseButton && (
              <AlertDialogPrimitive.Cancel asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute right-3 top-3 h-6 w-6 p-0",
                    "rounded-full opacity-70 hover:opacity-100",
                    "transition-all duration-200",
                    "hover:bg-neutral-100 focus:bg-neutral-100",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  )}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Close</span>
                </Button>
              </AlertDialogPrimitive.Cancel>
            )}
          </div>
        </motion.div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = "AlertDialogContent"

// Alert dialog header with icon
const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: AlertType }
>(({ className, type = "info", children, ...props }, ref) => {
  const typeConfig = alertTypeConfigs[type]
  const Icon = typeConfig.icon
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-3 p-6 pb-4",
        typeConfig.bgColor,
        className
      )}
      {...props}
    >
      <div className={cn("flex-shrink-0 mt-0.5", typeConfig.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        {children}
      </div>
    </div>
  )
})
AlertDialogHeader.displayName = "AlertDialogHeader"

// Alert dialog body
const AlertDialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-2", className)}
    {...props}
  />
))
AlertDialogBody.displayName = "AlertDialogBody"

// Alert dialog footer
const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-2 p-6 pt-4",
      "sm:flex-row sm:justify-end sm:gap-3",
      className
    )}
    {...props}
  />
))
AlertDialogFooter.displayName = "AlertDialogFooter"

// Alert dialog title
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-neutral-900",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

// Alert dialog description
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-neutral-600 leading-relaxed",
      className
    )}
    {...props}
  />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

// Alert dialog action button
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
    variant?: "default" | "destructive" | "outline"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    asChild
    {...props}
  >
    <Button variant={variant} className={className} />
  </AlertDialogPrimitive.Action>
))
AlertDialogAction.displayName = "AlertDialogAction"

// Alert dialog cancel button
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    asChild
    {...props}
  >
    <Button variant="outline" className={className} />
  </AlertDialogPrimitive.Cancel>
))
AlertDialogCancel.displayName = "AlertDialogCancel"

// Pre-built quick alert for common use cases
const QuickAlert: React.FC<QuickAlertProps> = ({
  open,
  onOpenChange,
  type,
  title,
  description,
  actionText = "OK",
  cancelText,
  onAction,
  onCancel,
  loading = false
}) => {
  const typeConfig = alertTypeConfigs[type]

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent type={type}>
        <AlertDialogHeader type={type}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          {cancelText && (
            <AlertDialogCancel onClick={handleCancel} disabled={loading}>
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            variant={typeConfig.buttonVariant}
            onClick={handleAction}
            disabled={loading}
            className={cn(
              type === "warning" && "bg-warning-600 hover:bg-warning-700 text-white"
            )}
          >
            {loading ? "Loading..." : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  QuickAlert,
  type AlertType,
  type QuickAlertProps
}