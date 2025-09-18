'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { forwardRef } from 'react'

// Animation variants for common patterns
export const fadeInVariants: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for premium feel
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const slideInVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20 
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const slideInFromLeftVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: -30 
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const slideInFromRightVariants: Variants = {
  hidden: { 
    opacity: 0,
    x: 30 
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export const scaleInVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95 
  },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Stagger animation for lists
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

export const staggerItemVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20 
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Base animated components
interface AnimatedDivProps extends HTMLMotionProps<'div'> {
  variant?: 'fadeIn' | 'slideIn' | 'slideInFromLeft' | 'slideInFromRight' | 'scaleIn'
  delay?: number
}

export const FadeIn = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ animationDelay: `${delay}s` }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
FadeIn.displayName = 'FadeIn'

export const SlideIn = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, className, variant = 'slideIn', delay = 0, ...props }, ref) => {
    const getVariants = () => {
      switch (variant) {
        case 'slideInFromLeft':
          return slideInFromLeftVariants
        case 'slideInFromRight':
          return slideInFromRightVariants
        default:
          return slideInVariants
      }
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={getVariants()}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ animationDelay: `${delay}s` }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
SlideIn.displayName = 'SlideIn'

export const ScaleIn = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={scaleInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ animationDelay: `${delay}s` }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
ScaleIn.displayName = 'ScaleIn'

// Stagger container for animating lists
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, className, staggerDelay = 0.1, ...props }, ref) => {
    const customVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1
        }
      },
      exit: {
        transition: {
          staggerChildren: 0.05,
          staggerDirection: -1
        }
      }
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={customVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerContainer.displayName = 'StaggerContainer'

export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={staggerItemVariants}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerItem.displayName = 'StaggerItem'