'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

// Button micro-interactions
export const buttonHoverVariants: Variants = {
  rest: { 
    scale: 1,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  tap: { 
    scale: 0.98,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    transition: {
      duration: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Card hover effects
export const cardHoverVariants: Variants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
  },
  hover: { 
    scale: 1.02,
    y: -2,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Glow effect for premium elements
export const glowVariants: Variants = {
  rest: { 
    boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
  },
  hover: { 
    boxShadow: '0 0 20px 0 rgba(59, 130, 246, 0.3)',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glow'
  onClick?: () => void
  disabled?: boolean
}

export function AnimatedButton({ 
  children, 
  className = '', 
  variant = 'default',
  onClick,
  disabled = false
}: AnimatedButtonProps) {
  const variants = variant === 'glow' ? glowVariants : buttonHoverVariants

  return (
    <motion.button
      className={className}
      variants={variants}
      initial="rest"
      whileHover={disabled ? "rest" : "hover"}
      whileTap={disabled ? "rest" : "tap"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function AnimatedCard({ 
  children, 
  className = '',
  onClick
}: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`inline-block h-4 w-4 border-2 border-current border-r-transparent rounded-full ${className}`}
      variants={spinnerVariants}
      animate="animate"
    />
  )
}

// Pulse animation for notifications
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export function PulseIndicator({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <motion.div
      className={className}
      variants={pulseVariants}
      animate="animate"
    >
      {children}
    </motion.div>
  )
}

// Ripple effect for button presses
export function RippleButton({ 
  children, 
  className = '',
  onClick
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <motion.span
        className="absolute inset-0 bg-white/20 rounded-full scale-0"
        whileTap={{
          scale: 4,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
      />
      {children}
    </motion.button>
  )
}