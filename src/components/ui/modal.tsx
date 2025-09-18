"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

// Modal size variants
type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full"

// Modal types for different use cases
type ModalType = "default" | "confirmation" | "destructive" | "success" | "info" | "warning"

interface ModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: ModalSize
  type?: ModalType
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  children: React.ReactNode
}

interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: ModalSize
  type?: ModalType
  showCloseButton?: boolean
}

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  type?: "destructive" | "warning" | "info"
  loading?: boolean
}

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
}

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: -20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.2,
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 }
  }
}

// Size configurations
const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw] max-h-[95vh]"
}

// Type configurations
const typeConfigs: Record<ModalType, { 
  icon?: React.ComponentType<{ className?: string }>,
  iconColor: string,
  borderColor: string 
}> = {
  default: { iconColor: "", borderColor: "" },
  confirmation: { 
    icon: Info, 
    iconColor: "text-primary-600", 
    borderColor: "border-primary-200" 
  },
  destructive: { 
    icon: AlertTriangle, 
    iconColor: "text-error-600", 
    borderColor: "border-error-200" 
  },
  success: { 
    icon: CheckCircle, 
    iconColor: "text-success-600", 
    borderColor: "border-success-200" 
  },
  info: { 
    icon: Info, 
    iconColor: "text-info-600", 
    borderColor: "border-info-200" 
  },
  warning: { 
    icon: AlertCircle, 
    iconColor: "text-warning-600", 
    borderColor: "border-warning-200" 
  }
}

const Modal = DialogPrimitive.Root

const ModalTrigger = DialogPrimitive.Trigger

const ModalClose = DialogPrimitive.Close

const ModalPortal = DialogPrimitive.Portal

// Enhanced overlay with backdrop blur
const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    asChild
    {...props}
  >
    <motion.div
      className={cn(
        "fixed inset-0 z-modal bg-neutral-900/20 backdrop-blur-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    />
  </DialogPrimitive.Overlay>
))
ModalOverlay.displayName = "ModalOverlay"

// Enhanced content with premium styling and animations
const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ className, children, size = "md", type = "default", showCloseButton = true, ...props }, ref) => {
  const typeConfig = typeConfigs[type]
  
  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "fixed left-[50%] top-[50%] z-modal translate-x-[-50%] translate-y-[-50%]",
            "w-full bg-background border border-neutral-200 shadow-2xl",
            "rounded-2xl overflow-hidden",
            sizeClasses[size],
            typeConfig.borderColor,
            className
          )}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative">
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute right-4 top-4 h-8 w-8 p-0",
                    "rounded-full opacity-70 hover:opacity-100",
                    "transition-all duration-200",
                    "hover:bg-neutral-100 focus:bg-neutral-100",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  )}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogPrimitive.Close>
            )}
          </div>
        </motion.div>
      </DialogPrimitive.Content>
    </ModalPortal>
  )
})
ModalContent.displayName = "ModalContent"

// Modal header with enhanced styling
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: ModalType }
>(({ className, type = "default", children, ...props }, ref) => {
  const typeConfig = typeConfigs[type]
  const Icon = typeConfig.icon
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-4 p-6 pb-4",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className={cn("flex-shrink-0 mt-1", typeConfig.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 space-y-1">
        {children}
      </div>
    </div>
  )
})
ModalHeader.displayName = "ModalHeader"

// Modal body with proper spacing
const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-2", className)}
    {...props}
  />
))
ModalBody.displayName = "ModalBody"

// Modal footer with action buttons
const ModalFooter = React.forwardRef<
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
ModalFooter.displayName = "ModalFooter"

// Modal title with enhanced typography
const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-neutral-900",
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

// Modal description with proper styling
const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm text-neutral-600 leading-relaxed",
      className
    )}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

// Pre-built confirmation modal for common use cases
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "info",
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" type={type} showCloseButton={false}>
        <ModalHeader type={type}>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              type === "warning" && "bg-warning-600 hover:bg-warning-700 text-white"
            )}
          >
            {loading ? "Loading..." : confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Responsive modal wrapper that adapts to screen size
const ResponsiveModal: React.FC<ModalProps> = ({
  children,
  size = "md",
  ...props
}) => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const responsiveSize = isMobile ? "full" : size

  return (
    <Modal {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === ModalContent) {
          return React.cloneElement(child, { 
            ...child.props, 
            size: responsiveSize,
            className: cn(
              child.props.className,
              isMobile && "m-4 h-[calc(100vh-2rem)] max-h-none"
            )
          })
        }
        return child
      })}
    </Modal>
  )
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ConfirmationModal,
  ResponsiveModal,
  type ModalSize,
  type ModalType,
  type ConfirmationModalProps
}