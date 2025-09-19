'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  ExternalLink,
  Undo2,
  Bell,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Icon, StatusIcon } from "./icon"

// Notification types and variants
export type NotificationType = "success" | "error" | "warning" | "info"
export type NotificationPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center"
export type NotificationSize = "sm" | "md" | "lg"

// Notification configuration
export const NOTIFICATION_CONFIG = {
  success: {
    icon: "CheckCircle" as const,
    colors: {
      bg: "bg-success-50 dark:bg-success-900/20",
      border: "border-success-200 dark:border-success-800",
      text: "text-success-800 dark:text-success-200",
      icon: "text-success-600 dark:text-success-400"
    },
    duration: 4000
  },
  error: {
    icon: "XCircle" as const,
    colors: {
      bg: "bg-error-50 dark:bg-error-900/20",
      border: "border-error-200 dark:border-error-800",
      text: "text-error-800 dark:text-error-200",
      icon: "text-error-600 dark:text-error-400"
    },
    duration: 6000
  },
  warning: {
    icon: "AlertTriangle" as const,
    colors: {
      bg: "bg-warning-50 dark:bg-warning-900/20",
      border: "border-warning-200 dark:border-warning-800",
      text: "text-warning-800 dark:text-warning-200",
      icon: "text-warning-600 dark:text-warning-400"
    },
    duration: 5000
  },
  info: {
    icon: "Info" as const,
    colors: {
      bg: "bg-info-50 dark:bg-info-900/20",
      border: "border-info-200 dark:border-info-800",
      text: "text-info-800 dark:text-info-200",
      icon: "text-info-600 dark:text-info-400"
    },
    duration: 4000
  }
} as const

// Position configurations
export const POSITION_CONFIG = {
  "top-right": {
    container: "fixed top-4 right-4 z-50",
    origin: "top-right"
  },
  "top-left": {
    container: "fixed top-4 left-4 z-50",
    origin: "top-left"
  },
  "bottom-right": {
    container: "fixed bottom-4 right-4 z-50",
    origin: "bottom-right"
  },
  "bottom-left": {
    container: "fixed bottom-4 left-4 z-50",
    origin: "bottom-left"
  },
  "top-center": {
    container: "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
    origin: "top"
  },
  "bottom-center": {
    container: "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
    origin: "bottom"
  }
} as const

// Size configurations
export const SIZE_CONFIG = {
  sm: {
    width: "w-80",
    padding: "p-3",
    iconSize: "sm" as const,
    titleSize: "text-sm",
    descriptionSize: "text-xs"
  },
  md: {
    width: "w-96",
    padding: "p-4",
    iconSize: "md" as const,
    titleSize: "text-sm",
    descriptionSize: "text-sm"
  },
  lg: {
    width: "w-[28rem]",
    padding: "p-5",
    iconSize: "lg" as const,
    titleSize: "text-base",
    descriptionSize: "text-sm"
  }
} as const

// Individual notification interface
export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  description?: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
  onDismiss?: () => void
  metadata?: Record<string, any>
}

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "ghost"
  loading?: boolean
}

// Notification component props
export interface NotificationProps extends Omit<NotificationData, 'id'> {
  id: string
  size?: NotificationSize
  onDismiss: (id: string) => void
  className?: string
}

// Animation variants
const notificationVariants = {
  initial: (position: NotificationPosition) => {
    const isTop = position.includes('top')
    const isRight = position.includes('right')
    const isLeft = position.includes('left')
    
    return {
      opacity: 0,
      scale: 0.95,
      x: isRight ? 100 : isLeft ? -100 : 0,
      y: isTop ? -20 : 20
    }
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.3
    }
  },
  exit: (position: NotificationPosition) => {
    const isRight = position.includes('right')
    const isLeft = position.includes('left')
    
    return {
      opacity: 0,
      scale: 0.95,
      x: isRight ? 100 : isLeft ? -100 : 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  }
}

// Individual notification component
export const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ 
    id,
    type, 
    title, 
    description, 
    duration = NOTIFICATION_CONFIG[type].duration,
    persistent = false,
    actions = [],
    onDismiss,
    size = "md",
    className,
    metadata,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [timeLeft, setTimeLeft] = React.useState(duration)
    const timerRef = React.useRef<NodeJS.Timeout>()
    const progressRef = React.useRef<HTMLDivElement>(null)
    
    const config = NOTIFICATION_CONFIG[type]
    const sizeConfig = SIZE_CONFIG[size]
    
    // Auto-dismiss timer
    React.useEffect(() => {
      if (persistent) return
      
      const startTime = Date.now()
      const updateProgress = () => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, duration - elapsed)
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
          handleDismiss()
        } else {
          timerRef.current = setTimeout(updateProgress, 100)
        }
      }
      
      timerRef.current = setTimeout(updateProgress, 100)
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    }, [duration, persistent])
    
    const handleDismiss = React.useCallback(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(id), 200)
    }, [id, onDismiss])
    
    const progressPercentage = persistent ? 0 : ((duration - timeLeft) / duration) * 100
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm",
          "bg-white dark:bg-gray-900",
          sizeConfig.width,
          config.colors.border,
          className
        )}
        {...props}
      >
        {/* Progress bar */}
        {!persistent && (
          <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full">
            <motion.div
              ref={progressRef}
              className={cn(
                "h-full transition-all duration-100 ease-linear",
                type === 'success' && "bg-success-500",
                type === 'error' && "bg-error-500",
                type === 'warning' && "bg-warning-500",
                type === 'info' && "bg-info-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
        
        {/* Content */}
        <div className={cn("flex items-start gap-3", sizeConfig.padding)}>
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <StatusIcon 
              name={config.icon}
              status={type}
              size={sizeConfig.iconSize}
              className={config.colors.icon}
            />
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              "font-semibold leading-tight",
              sizeConfig.titleSize,
              config.colors.text
            )}>
              {title}
            </div>
            
            {description && (
              <div className={cn(
                "mt-1 leading-relaxed text-gray-600 dark:text-gray-300",
                sizeConfig.descriptionSize
              )}>
                {description}
              </div>
            )}
            
            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || "ghost"}
                    onClick={action.onClick}
                    disabled={action.loading}
                    className="h-7 px-2 text-xs"
                  >
                    {action.loading ? "Loading..." : action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <Icon name="X" size="xs" />
            <span className="sr-only">Dismiss notification</span>
          </Button>
        </div>
      </motion.div>
    )
  }
)

Notification.displayName = "Notification"

// Notification container component
export interface NotificationContainerProps {
  notifications: NotificationData[]
  position?: NotificationPosition
  size?: NotificationSize
  maxNotifications?: number
  onDismiss: (id: string) => void
  className?: string
}

export const NotificationContainer = React.forwardRef<HTMLDivElement, NotificationContainerProps>(
  ({ 
    notifications, 
    position = "top-right", 
    size = "md",
    maxNotifications = 5,
    onDismiss,
    className 
  }, ref) => {
    const positionConfig = POSITION_CONFIG[position]
    const visibleNotifications = notifications.slice(0, maxNotifications)
    
    return (
      <div
        ref={ref}
        className={cn(positionConfig.container, className)}
        style={{ transformOrigin: positionConfig.origin }}
      >
        <AnimatePresence mode="popLayout">
          {visibleNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              className="mb-3 last:mb-0"
              custom={position}
              variants={notificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Notification
                {...notification}
                size={size}
                onDismiss={onDismiss}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Overflow indicator */}
        {notifications.length > maxNotifications && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-full">
              <Bell className="h-3 w-3" />
              +{notifications.length - maxNotifications} more notifications
            </div>
          </motion.div>
        )}
      </div>
    )
  }
)

NotificationContainer.displayName = "NotificationContainer"

// Notification context and provider
interface NotificationContextValue {
  notifications: NotificationData[]
  addNotification: (notification: Omit<NotificationData, 'id'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
  updateNotification: (id: string, updates: Partial<NotificationData>) => void
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null)

export interface NotificationProviderProps {
  children: React.ReactNode
  position?: NotificationPosition
  size?: NotificationSize
  maxNotifications?: number
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  position = "top-right",
  size = "md",
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = React.useState<NotificationData[]>([])
  
  const addNotification = React.useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: NotificationData = { ...notification, id }
    
    setNotifications(prev => [newNotification, ...prev])
    return id
  }, [])
  
  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])
  
  const clearNotifications = React.useCallback(() => {
    setNotifications([])
  }, [])
  
  const updateNotification = React.useCallback((id: string, updates: Partial<NotificationData>) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, ...updates } : n)
    )
  }, [])
  
  const contextValue: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    updateNotification
  }
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        position={position}
        size={size}
        maxNotifications={maxNotifications}
        onDismiss={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

// Hook to use notifications
export const useNotifications = () => {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Convenience hooks for different notification types
export const useNotify = () => {
  const { addNotification } = useNotifications()
  
  return React.useMemo(() => ({
    success: (title: string, description?: string, options?: Partial<NotificationData>) =>
      addNotification({ type: 'success', title, description, ...options }),
    
    error: (title: string, description?: string, options?: Partial<NotificationData>) =>
      addNotification({ type: 'error', title, description, ...options }),
    
    warning: (title: string, description?: string, options?: Partial<NotificationData>) =>
      addNotification({ type: 'warning', title, description, ...options }),
    
    info: (title: string, description?: string, options?: Partial<NotificationData>) =>
      addNotification({ type: 'info', title, description, ...options }),
  }), [addNotification])
}

export type { NotificationContextValue }