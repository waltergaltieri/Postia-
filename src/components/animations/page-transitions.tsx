'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ReactNode } from 'react'

// Page transition variants
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const slidePageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 30
  },
  in: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  in: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  out: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'slide' | 'modal'
}

export function PageTransition({ 
  children, 
  className = '', 
  variant = 'default' 
}: PageTransitionProps) {
  const getVariants = () => {
    switch (variant) {
      case 'slide':
        return slidePageVariants
      case 'modal':
        return modalVariants
      default:
        return pageVariants
    }
  }

  return (
    <motion.div
      className={className}
      variants={getVariants()}
      initial="initial"
      animate="in"
      exit="out"
    >
      {children}
    </motion.div>
  )
}

interface AnimatedPageProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'slide' | 'modal'
  key?: string
}

export function AnimatedPage({ 
  children, 
  className = '', 
  variant = 'default',
  key 
}: AnimatedPageProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition 
        key={key} 
        className={className} 
        variant={variant}
      >
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}

// Layout transition for dashboard sections
interface LayoutTransitionProps {
  children: ReactNode
  className?: string
  layoutId?: string
}

export function LayoutTransition({ 
  children, 
  className = '',
  layoutId 
}: LayoutTransitionProps) {
  return (
    <motion.div
      className={className}
      layoutId={layoutId}
      layout
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  )
}

// Backdrop for modals and overlays
interface AnimatedBackdropProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function AnimatedBackdrop({ 
  children, 
  className = '',
  onClick 
}: AnimatedBackdropProps) {
  return (
    <motion.div
      className={`fixed inset-0 z-50 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

// Shared layout animations for cards and content
export const sharedLayoutVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Hover animations for interactive elements
export const hoverVariants: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Press animation for buttons
export const pressVariants: Variants = {
  rest: { scale: 1 },
  press: { 
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}