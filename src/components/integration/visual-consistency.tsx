'use client'

import { createContext, useContext, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Visual consistency configuration
interface VisualTheme {
  animations: {
    duration: {
      fast: number
      normal: number
      slow: number
    }
    easing: {
      smooth: number[]
      bounce: number[]
      sharp: number[]
    }
  }
  spacing: {
    component: string
    section: string
    page: string
  }
  elevation: {
    card: string
    modal: string
    dropdown: string
    tooltip: string
  }
  borderRadius: {
    small: string
    medium: string
    large: string
  }
}

const DEFAULT_THEME: VisualTheme = {
  animations: {
    duration: {
      fast: 0.15,
      normal: 0.3,
      slow: 0.5
    },
    easing: {
      smooth: [0.4, 0, 0.2, 1],
      bounce: [0.68, -0.55, 0.265, 1.55],
      sharp: [0.25, 0.46, 0.45, 0.94]
    }
  },
  spacing: {
    component: 'space-y-4',
    section: 'space-y-6',
    page: 'space-y-8'
  },
  elevation: {
    card: 'shadow-sm hover:shadow-md',
    modal: 'shadow-xl',
    dropdown: 'shadow-lg',
    tooltip: 'shadow-md'
  },
  borderRadius: {
    small: 'rounded-md',
    medium: 'rounded-lg',
    large: 'rounded-xl'
  }
}

const VisualThemeContext = createContext<VisualTheme>(DEFAULT_THEME)

interface VisualThemeProviderProps {
  children: ReactNode
  theme?: Partial<VisualTheme>
}

export function VisualThemeProvider({ children, theme }: VisualThemeProviderProps) {
  const mergedTheme = { ...DEFAULT_THEME, ...theme }
  
  return (
    <VisualThemeContext.Provider value={mergedTheme}>
      {children}
    </VisualThemeContext.Provider>
  )
}

export function useVisualTheme() {
  return useContext(VisualThemeContext)
}

// Consistent animation components
interface ConsistentMotionProps {
  children: ReactNode
  type?: 'fade' | 'slide' | 'scale' | 'bounce'
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  className?: string
}

export function ConsistentMotion({ 
  children, 
  type = 'fade', 
  direction = 'up', 
  delay = 0,
  className = ""
}: ConsistentMotionProps) {
  const theme = useVisualTheme()
  
  const getVariants = () => {
    const distance = 20
    
    switch (type) {
      case 'slide':
        return {
          initial: {
            opacity: 0,
            x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
            y: direction === 'up' ? distance : direction === 'down' ? -distance : 0
          },
          animate: {
            opacity: 1,
            x: 0,
            y: 0
          }
        }
      
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 }
        }
      
      case 'bounce':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 }
        }
      
      default: // fade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 }
        }
    }
  }
  
  const variants = getVariants()
  const easing = type === 'bounce' ? theme.animations.easing.bounce : theme.animations.easing.smooth
  
  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{
        duration: theme.animations.duration.normal,
        ease: easing,
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Consistent card component
interface ConsistentCardProps {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  interactive?: boolean
  className?: string
  onClick?: () => void
}

export function ConsistentCard({ 
  children, 
  variant = 'default', 
  size = 'medium',
  interactive = false,
  className = "",
  onClick
}: ConsistentCardProps) {
  const theme = useVisualTheme()
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return `bg-card border border-border ${theme.elevation.card}`
      case 'outlined':
        return 'bg-card border-2 border-border'
      case 'ghost':
        return 'bg-transparent'
      default:
        return 'bg-card border border-border shadow-sm'
    }
  }
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'p-3'
      case 'large':
        return 'p-8'
      default:
        return 'p-6'
    }
  }
  
  const baseStyles = cn(
    theme.borderRadius.medium,
    getVariantStyles(),
    getSizeStyles(),
    interactive && 'cursor-pointer transition-all duration-200 hover:shadow-md',
    className
  )
  
  if (interactive) {
    return (
      <motion.div
        className={baseStyles}
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{
          duration: theme.animations.duration.fast,
          ease: theme.animations.easing.smooth
        }}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div className={baseStyles}>
      {children}
    </div>
  )
}

// Consistent button animations
interface ConsistentButtonProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function ConsistentButton({ 
  children, 
  variant = 'default',
  size = 'medium',
  loading = false,
  disabled = false,
  className = "",
  onClick
}: ConsistentButtonProps) {
  const theme = useVisualTheme()
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90'
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      case 'ghost':
        return 'hover:bg-accent hover:text-accent-foreground'
      case 'destructive':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      default:
        return 'bg-background border border-input hover:bg-accent hover:text-accent-foreground'
    }
  }
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'h-8 px-3 text-sm'
      case 'large':
        return 'h-12 px-8 text-lg'
      default:
        return 'h-10 px-4'
    }
  }
  
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    theme.borderRadius.medium,
    getVariantStyles(),
    getSizeStyles(),
    className
  )
  
  return (
    <motion.button
      className={baseStyles}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{
        duration: theme.animations.duration.fast,
        ease: theme.animations.easing.smooth
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
        />
      ) : null}
      {children}
    </motion.button>
  )
}

// Consistent layout components
interface ConsistentContainerProps {
  children: ReactNode
  size?: 'small' | 'medium' | 'large' | 'full'
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export function ConsistentContainer({ 
  children, 
  size = 'medium',
  spacing = 'normal',
  className = ""
}: ConsistentContainerProps) {
  const theme = useVisualTheme()
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'max-w-2xl'
      case 'large':
        return 'max-w-7xl'
      case 'full':
        return 'max-w-none'
      default:
        return 'max-w-4xl'
    }
  }
  
  const getSpacingStyles = () => {
    switch (spacing) {
      case 'tight':
        return theme.spacing.component
      case 'loose':
        return theme.spacing.page
      default:
        return theme.spacing.section
    }
  }
  
  return (
    <div className={cn(
      'mx-auto px-4',
      getSizeStyles(),
      getSpacingStyles(),
      className
    )}>
      {children}
    </div>
  )
}

// Consistent section wrapper
interface ConsistentSectionProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function ConsistentSection({ 
  children, 
  title, 
  description, 
  actions,
  className = ""
}: ConsistentSectionProps) {
  const theme = useVisualTheme()
  
  return (
    <section className={cn(theme.spacing.section, className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

// Consistent grid layout
interface ConsistentGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4 | 6
  gap?: 'small' | 'medium' | 'large'
  responsive?: boolean
  className?: string
}

export function ConsistentGrid({ 
  children, 
  columns = 3,
  gap = 'medium',
  responsive = true,
  className = ""
}: ConsistentGridProps) {
  const getColumnStyles = () => {
    if (responsive) {
      switch (columns) {
        case 1:
          return 'grid-cols-1'
        case 2:
          return 'grid-cols-1 md:grid-cols-2'
        case 3:
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        case 4:
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        case 6:
          return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
        default:
          return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }
    } else {
      return `grid-cols-${columns}`
    }
  }
  
  const getGapStyles = () => {
    switch (gap) {
      case 'small':
        return 'gap-3'
      case 'large':
        return 'gap-8'
      default:
        return 'gap-6'
    }
  }
  
  return (
    <div className={cn(
      'grid',
      getColumnStyles(),
      getGapStyles(),
      className
    )}>
      {children}
    </div>
  )
}

// Export all consistency utilities
export const VisualConsistency = {
  Motion: ConsistentMotion,
  Card: ConsistentCard,
  Button: ConsistentButton,
  Container: ConsistentContainer,
  Section: ConsistentSection,
  Grid: ConsistentGrid
}