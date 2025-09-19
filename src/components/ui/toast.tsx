"use client"

import * as React from "react"
import { Toaster as Sonner } from "sonner"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  ExternalLink,
  Undo2
} from "lucide-react"
import { cn } from "@/lib/utils"

type ToastProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToastProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-900 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-neutral-600",
          actionButton:
            "group-[.toast]:bg-primary-600 group-[.toast]:text-white group-[.toast]:hover:bg-primary-700 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-600 group-[.toast]:hover:bg-neutral-200 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
        },
      }}
      {...props}
    />
  )
}

// Custom toast variants with premium styling
const ToastVariants = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-success" />,
    className: "border-l-4 border-l-success bg-success/5",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-error" />,
    className: "border-l-4 border-l-error bg-error/5",
  },
  warning: {
    icon: <AlertCircle className="h-5 w-5 text-warning" />,
    className: "border-l-4 border-l-warning bg-warning/5",
  },
  info: {
    icon: <Info className="h-5 w-5 text-info" />,
    className: "border-l-4 border-l-info bg-info/5",
  },
}

// Enhanced toast component with animations
interface CustomToastProps {
  title: string
  description?: string
  variant?: keyof typeof ToastVariants
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick: () => void
  }
  duration?: number
  dismissible?: boolean
}

const CustomToast = React.forwardRef<
  HTMLDivElement,
  CustomToastProps & React.HTMLAttributes<HTMLDivElement>
>(({ 
  title, 
  description, 
  variant = "info", 
  action, 
  cancel,
  dismissible = true,
  className,
  ...props 
}, ref) => {
  const variantConfig = ToastVariants[variant]
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.3 
      }}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lg backdrop-blur-sm",
        variantConfig.className,
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {variantConfig.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-neutral-900 text-sm">
          {title}
        </div>
        {description && (
          <div className="mt-1 text-sm text-neutral-600 leading-relaxed">
            {description}
          </div>
        )}
        
        {/* Actions */}
        {(action || cancel) && (
          <div className="flex items-center gap-2 mt-3">
            {action && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                {action.label}
                <ExternalLink className="h-3 w-3" />
              </motion.button>
            )}
            {cancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={cancel.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <Undo2 className="h-3 w-3" /> <span>{cancel.label}</span></motion.button>
            )}
          </div>
        )}
      </div>
      
      {/* Dismiss button */}
      {dismissible && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          onClick={() => {
            // This will be handled by the toast library
          }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}
      
      {/* Progress bar for timed toasts */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: "linear" }}
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 origin-left"
      />
    </motion.div>
  )
})

CustomToast.displayName = "CustomToast"

export { Toaster, CustomToast, ToastVariants }
export type { CustomToastProps }