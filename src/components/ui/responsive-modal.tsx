"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

// Enhanced responsive modal types
type ResponsiveModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"
type ResponsiveModalPosition = "center" | "top" | "bottom" | "left" | "right"

interface ResponsiveModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: ResponsiveModalSize
  position?: ResponsiveModalPosition
  fullscreenOnMobile?: boolean
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  children: React.ReactNode
}

interface ResponsiveModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: ResponsiveModalSize
  position?: ResponsiveModalPosition
  fullscreenOnMobile?: boolean
  showCloseButton?: boolean
}

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Animation variants for different screen sizes
const getModalVariants = (isMobile: boolean, position: ResponsiveModalPosition) => {
  if (isMobile) {
    return {
      hidden: { 
        opacity: 0, 
        y: "100%"
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.3,
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      },
      exit: { 
        opacity: 0, 
        y: "100%",
        transition: { duration: 0.2 }
      }
    }
  }

  // Desktop animations based on position
  const baseVariants = {
    center: { opacity: 0, scale: 0.95, y: -20 },
    top: { opacity: 0, y: -50 },
    bottom: { opacity: 0, y: 50 },
    left: { opacity: 0, x: -50 },
    right: { opacity: 0, x: 50 }
  }

  return {
    hidden: baseVariants[position],
    visible: { 
      opacity: 1, 
      scale: 1,
      x: 0,
      y: 0,
      transition: { 
        duration: 0.2,
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      ...baseVariants[position],
      transition: { duration: 0.15 }
    }
  }
}

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

const ResponsiveModal = DialogPrimitive.Root

const ResponsiveModalTrigger = DialogPrimitive.Trigger

const ResponsiveModalClose = DialogPrimitive.Close

const ResponsiveModalPortal = DialogPrimitive.Portal

// Enhanced overlay with mobile optimizations
const ResponsiveModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      asChild
      {...props}
    >
      <motion.div
        className={cn(
          "modal-overlay-responsive",
          isMobile && "mobile-modal-overlay",
          className
        )}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      />
    </DialogPrimitive.Overlay>
  )
})
ResponsiveModalOverlay.displayName = "ResponsiveModalOverlay"

// Enhanced content with responsive behavior
const ResponsiveModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResponsiveModalContentProps
>(({ 
  className, 
  children, 
  size = "md", 
  position = "center",
  fullscreenOnMobile = false,
  showCloseButton = true, 
  ...props 
}, ref) => {
  const isMobile = useIsMobile()
  const modalVariants = getModalVariants(isMobile, position)
  
  return (
    <ResponsiveModalPortal>
      <ResponsiveModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "modal-content-responsive",
            `modal-size-${size}`,
            isMobile && "mobile-modal-content",
            isMobile && fullscreenOnMobile && "modal-fullscreen-mobile",
            className
          )}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative h-full flex flex-col">
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "absolute right-4 top-4 z-10",
                    isMobile ? "modal-close-mobile" : "h-8 w-8 p-0",
                    "rounded-full opacity-70 hover:opacity-100",
                    "transition-all duration-200",
                    "hover:bg-muted focus:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                >
                  <X className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogPrimitive.Close>
            )}
          </div>
        </motion.div>
      </DialogPrimitive.Content>
    </ResponsiveModalPortal>
  )
})
ResponsiveModalContent.displayName = "ResponsiveModalContent"

// Responsive modal header
const ResponsiveModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <div
      ref={ref}
      className={cn(
        isMobile ? "modal-header-mobile" : "flex flex-col space-y-1.5 p-6 pb-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResponsiveModalHeader.displayName = "ResponsiveModalHeader"

// Responsive modal body with proper scrolling
const ResponsiveModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <div
      ref={ref}
      className={cn(
        isMobile ? "modal-body-mobile" : "flex-1 px-6 py-2 overflow-y-auto",
        className
      )}
      {...props}
    />
  )
})
ResponsiveModalBody.displayName = "ResponsiveModalBody"

// Responsive modal footer
const ResponsiveModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <div
      ref={ref}
      className={cn(
        isMobile 
          ? "modal-footer-mobile" 
          : "flex flex-col-reverse gap-2 p-6 pt-4 sm:flex-row sm:justify-end sm:gap-3",
        className
      )}
      {...props}
    >
      {isMobile ? (
        // Stack buttons vertically on mobile
        React.Children.map(children, (child, index) => (
          <div key={index} className="w-full">
            {React.isValidElement(child) && child.type === Button
              ? React.cloneElement(child, { 
                  ...child.props, 
                  className: cn(child.props.className, "modal-button w-full")
                })
              : child
            }
          </div>
        ))
      ) : (
        children
      )}
    </div>
  )
})
ResponsiveModalFooter.displayName = "ResponsiveModalFooter"

// Modal title with responsive typography
const ResponsiveModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        isMobile 
          ? "text-lg font-semibold leading-tight text-foreground" 
          : "text-xl font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
})
ResponsiveModalTitle.displayName = "ResponsiveModalTitle"

// Modal description with responsive typography
const ResponsiveModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        isMobile 
          ? "text-sm text-muted-foreground leading-relaxed mt-1" 
          : "text-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  )
})
ResponsiveModalDescription.displayName = "ResponsiveModalDescription"

// Responsive confirmation modal
interface ResponsiveConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
  size?: ResponsiveModalSize
}

const ResponsiveConfirmationModal: React.FC<ResponsiveConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
  size = "sm"
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent size={size} showCloseButton={false}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle> <span>{title}</span></ResponsiveModalTitle>
          <ResponsiveModalDescription>{description}</ResponsiveModalDescription>
        </ResponsiveModalHeader>
        
        <ResponsiveModalFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          > <span>{cancelText}</span></Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          > <span>{loading ? "Loading..." : confirmText}</span></Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  )
}

// Hook for responsive modal management
export function useResponsiveModal() {
  const isMobile = useIsMobile()
  
  return {
    isMobile,
    getOptimalSize: (desktopSize: ResponsiveModalSize): ResponsiveModalSize => {
      if (isMobile) {
        return "full"
      }
      return desktopSize
    },
    getOptimalPosition: (desktopPosition: ResponsiveModalPosition): ResponsiveModalPosition => {
      if (isMobile) {
        return "bottom"
      }
      return desktopPosition
    }
  }
}

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalClose,
  ResponsiveModalPortal,
  ResponsiveModalOverlay,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalBody,
  ResponsiveModalFooter,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveConfirmationModal,
  useResponsiveModal,
  type ResponsiveModalSize,
  type ResponsiveModalPosition,
  type ResponsiveConfirmationModalProps
}