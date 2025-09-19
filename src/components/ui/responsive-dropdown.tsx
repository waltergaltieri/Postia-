"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, Circle } from "lucide-react"
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

// Animation variants
const getDropdownVariants = (isMobile: boolean) => {
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
          duration: 0.25,
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

  return {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
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
}

const ResponsiveDropdownMenu = DropdownMenuPrimitive.Root

const ResponsiveDropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const ResponsiveDropdownMenuGroup = DropdownMenuPrimitive.Group

const ResponsiveDropdownMenuPortal = DropdownMenuPrimitive.Portal

const ResponsiveDropdownMenuSub = DropdownMenuPrimitive.Sub

const ResponsiveDropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

// Enhanced dropdown content with mobile optimizations
const ResponsiveDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const isMobile = useIsMobile()
  const dropdownVariants = getDropdownVariants(isMobile)
  
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={isMobile ? 0 : sideOffset}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "dropdown-content-responsive",
            isMobile && "mobile-dropdown",
            className
          )}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {isMobile && (
            <div className="dropdown-handle-mobile" />
          )}
          {props.children}
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
})
ResponsiveDropdownMenuContent.displayName = "ResponsiveDropdownMenuContent"

// Responsive dropdown item
const ResponsiveDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        isMobile 
          ? "dropdown-item-mobile"
          : "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
})
ResponsiveDropdownMenuItem.displayName = "ResponsiveDropdownMenuItem"

// Responsive dropdown checkbox item
const ResponsiveDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        isMobile
          ? "dropdown-item-mobile"
          : "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className={cn(
        isMobile 
          ? "flex h-6 w-6 items-center justify-center mr-3"
          : "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
      )}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
})
ResponsiveDropdownMenuCheckboxItem.displayName = "ResponsiveDropdownMenuCheckboxItem"

// Responsive dropdown radio item
const ResponsiveDropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        isMobile
          ? "dropdown-item-mobile"
          : "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className={cn(
        isMobile 
          ? "flex h-6 w-6 items-center justify-center mr-3"
          : "absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
      )}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className={cn(isMobile ? "h-3 w-3 fill-current" : "h-2 w-2 fill-current")} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
})
ResponsiveDropdownMenuRadioItem.displayName = "ResponsiveDropdownMenuRadioItem"

// Responsive dropdown label
const ResponsiveDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        isMobile
          ? "px-4 py-3 text-sm font-semibold text-foreground border-b border-border"
          : "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
})
ResponsiveDropdownMenuLabel.displayName = "ResponsiveDropdownMenuLabel"

// Responsive dropdown separator
const ResponsiveDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn(
        isMobile 
          ? "h-px bg-border"
          : "-mx-1 my-1 h-px bg-muted",
        className
      )}
      {...props}
    />
  )
})
ResponsiveDropdownMenuSeparator.displayName = "ResponsiveDropdownMenuSeparator"

// Responsive dropdown shortcut
const ResponsiveDropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  const isMobile = useIsMobile()
  
  // Hide shortcuts on mobile for cleaner look
  if (isMobile) return null
  
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
ResponsiveDropdownMenuShortcut.displayName = "ResponsiveDropdownMenuShortcut"

// Responsive dropdown sub trigger
const ResponsiveDropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        isMobile
          ? "dropdown-item-mobile"
          : "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className={cn(
        isMobile ? "ml-auto h-5 w-5" : "ml-auto h-4 w-4"
      )} />
    </DropdownMenuPrimitive.SubTrigger>
  )
})
ResponsiveDropdownMenuSubTrigger.displayName = "ResponsiveDropdownMenuSubTrigger"

// Responsive dropdown sub content
const ResponsiveDropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile()
  
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        isMobile
          ? "dropdown-content-responsive mobile-dropdown"
          : "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  )
})
ResponsiveDropdownMenuSubContent.displayName = "ResponsiveDropdownMenuSubContent"

// Hook for responsive dropdown management
export function useResponsiveDropdown() {
  const isMobile = useIsMobile()
  
  return {
    isMobile,
    getOptimalSide: (desktopSide: "top" | "right" | "bottom" | "left" = "bottom") => {
      if (isMobile) {
        return "bottom"
      }
      return desktopSide
    },
    getOptimalAlign: (desktopAlign: "start" | "center" | "end" = "start") => {
      if (isMobile) {
        return "center"
      }
      return desktopAlign
    }
  }
}

export {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuTrigger,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuCheckboxItem,
  ResponsiveDropdownMenuRadioItem,
  ResponsiveDropdownMenuLabel,
  ResponsiveDropdownMenuSeparator,
  ResponsiveDropdownMenuShortcut,
  ResponsiveDropdownMenuGroup,
  ResponsiveDropdownMenuPortal,
  ResponsiveDropdownMenuSub,
  ResponsiveDropdownMenuSubContent,
  ResponsiveDropdownMenuSubTrigger,
  ResponsiveDropdownMenuRadioGroup,
  useResponsiveDropdown
}