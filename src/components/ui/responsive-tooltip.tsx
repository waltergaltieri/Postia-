"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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

// Animation variants for tooltips
const getTooltipVariants = (isMobile: boolean) => {
  if (isMobile) {
    return {
      hidden: { 
        opacity: 0, 
        y: 10,
        scale: 0.95
      },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: { 
          duration: 0.2,
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      },
      exit: { 
        opacity: 0, 
        y: 10,
        scale: 0.95,
        transition: { duration: 0.15 }
      }
    }
  }

  return {
    hidden: { 
      opacity: 0, 
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      scale: 1,
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
      transition: { duration: 0.1 }
    }
  }
}

const ResponsiveTooltipProvider = TooltipPrimitive.Provider

const ResponsiveTooltip = TooltipPrimitive.Root

const ResponsiveTooltipTrigger = TooltipPrimitive.Trigger

// Enhanced tooltip content with mobile optimizations
const ResponsiveTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    hideOnMobile?: boolean
    mobilePosition?: "top" | "bottom" | "fixed-bottom"
  }
>(({ 
  className, 
  sideOffset = 4, 
  hideOnMobile = false,
  mobilePosition = "bottom",
  ...props 
}, ref) => {
  const isMobile = useIsMobile()
  const tooltipVariants = getTooltipVariants(isMobile)
  
  // Hide tooltip on mobile if specified
  if (isMobile && hideOnMobile) {
    return null
  }
  
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={isMobile ? 8 : sideOffset}
      side={isMobile ? "bottom" : undefined}
      asChild
      {...props}
    >
      <motion.div
        className={cn(
          "tooltip-content-responsive",
          isMobile && "tooltip-mobile",
          isMobile && mobilePosition === "fixed-bottom" && "tooltip-mobile-fixed",
          className
        )}
        variants={tooltipVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {props.children}
        {!isMobile && (
          <TooltipPrimitive.Arrow className="fill-popover" />
        )}
      </motion.div>
    </TooltipPrimitive.Content>
  )
})
ResponsiveTooltipContent.displayName = "ResponsiveTooltipContent"

// Enhanced tooltip with mobile-friendly behavior
interface ResponsiveTooltipWrapperProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  hideOnMobile?: boolean
  mobilePosition?: "top" | "bottom" | "fixed-bottom"
  className?: string
  contentClassName?: string
}

const ResponsiveTooltipWrapper: React.FC<ResponsiveTooltipWrapperProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
  hideOnMobile = false,
  mobilePosition = "bottom",
  className,
  contentClassName
}) => {
  const isMobile = useIsMobile()
  
  return (
    <ResponsiveTooltip delayDuration={isMobile ? 0 : delayDuration}>
      <ResponsiveTooltipTrigger asChild className={className}>
        {children}
      </ResponsiveTooltipTrigger>
      <ResponsiveTooltipContent
        side={isMobile ? "bottom" : side}
        align={isMobile ? "center" : align}
        hideOnMobile={hideOnMobile}
        mobilePosition={mobilePosition}
        className={contentClassName}
      >
        {content}
      </ResponsiveTooltipContent>
    </ResponsiveTooltip>
  )
}

// Quick tooltip component for simple text tooltips
interface QuickTooltipProps {
  text: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  hideOnMobile?: boolean
  className?: string
}

const QuickTooltip: React.FC<QuickTooltipProps> = ({
  text,
  children,
  side = "top",
  hideOnMobile = true,
  className
}) => {
  return (
    <ResponsiveTooltipWrapper
      content={<span className="text-sm">{text}</span>}
      side={side}
      hideOnMobile={hideOnMobile}
      className={className}
    >
      {children}
    </ResponsiveTooltipWrapper>
  )
}

// Rich tooltip component for complex content
interface RichTooltipProps {
  title?: string
  description: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  hideOnMobile?: boolean
  className?: string
}

const RichTooltip: React.FC<RichTooltipProps> = ({
  title,
  description,
  children,
  side = "top",
  hideOnMobile = false,
  className
}) => {
  return (
    <ResponsiveTooltipWrapper
      content={
        <div className="space-y-1">
          {title && (
            <div className="font-semibold text-sm text-foreground">
              {title}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {description}
          </div>
        </div>
      }
      side={side}
      hideOnMobile={hideOnMobile}
      mobilePosition="fixed-bottom"
      className={className}
      contentClassName="max-w-xs"
    >
      {children}
    </ResponsiveTooltipWrapper>
  )
}

// Hook for responsive tooltip management
export function useResponsiveTooltip() {
  const isMobile = useIsMobile()
  
  return {
    isMobile,
    shouldShowTooltip: (hideOnMobile: boolean = true) => {
      return !isMobile || !hideOnMobile
    },
    getOptimalSide: (desktopSide: "top" | "right" | "bottom" | "left" = "top") => {
      if (isMobile) {
        return "bottom"
      }
      return desktopSide
    },
    getOptimalDelay: (desktopDelay: number = 300) => {
      if (isMobile) {
        return 0 // No delay on mobile for better touch experience
      }
      return desktopDelay
    }
  }
}

// Tooltip provider wrapper that sets up responsive defaults
const ResponsiveTooltipProviderWrapper: React.FC<{
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
}> = ({ 
  children, 
  delayDuration = 300, 
  skipDelayDuration = 100 
}) => {
  const isMobile = useIsMobile()
  
  return (
    <ResponsiveTooltipProvider
      delayDuration={isMobile ? 0 : delayDuration}
      skipDelayDuration={isMobile ? 0 : skipDelayDuration}
    >
      {children}
    </ResponsiveTooltipProvider>
  )
}

export {
  ResponsiveTooltipProvider,
  ResponsiveTooltipProviderWrapper,
  ResponsiveTooltip,
  ResponsiveTooltipTrigger,
  ResponsiveTooltipContent,
  ResponsiveTooltipWrapper,
  QuickTooltip,
  RichTooltip,
  useResponsiveTooltip
}