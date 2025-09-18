'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'
import { Loader2, FileText, Image, Calendar, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Skeleton animation variants
const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Base Skeleton Component
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'pulse'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const variants = variant === 'pulse' ? pulseVariants : skeletonVariants

  return (
    <motion.div
      className={cn(
        "bg-muted rounded-md",
        className
      )}
      variants={variants}
      animate="animate"
    />
  )
}

// Content Card Skeleton
export function ContentCardSkeleton() {
  return (
    <div className="border rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      <Skeleton className="h-32 w-full rounded-lg" />
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      
      <div className="flex justify-between items-center pt-2">
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}

// Calendar Event Skeleton
export function CalendarEventSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center space-x-2 pt-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === 0 ? "w-1/4" : i === columns - 1 ? "w-20" : "w-1/3"
          )} 
        />
      ))}
    </div>
  )
}

// Progress Indicators
interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressRing({ 
  progress, 
  size = 40, 
  strokeWidth = 3,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn("relative", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-primary-500"
          style={{
            strokeDasharray,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Linear Progress Bar
interface ProgressBarProps {
  progress: number
  className?: string
  showLabel?: boolean
  animated?: boolean
}

export function ProgressBar({ 
  progress, 
  className,
  showLabel = false,
  animated = true
}: ProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={animated ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }}
        />
      </div>
    </div>
  )
}

// Step Progress Indicator
interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <motion.div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              index < currentStep
                ? "bg-primary-500 text-white"
                : index === currentStep
                ? "bg-primary-100 text-primary-700 border-2 border-primary-500"
                : "bg-muted text-muted-foreground"
            )}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
              scale: index === currentStep ? 1.1 : 1,
              opacity: 1
            }}
            transition={{ duration: 0.3 }}
          >
            {index < currentStep ? "✓" : index + 1}
          </motion.div>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-12 h-0.5 mx-2 transition-colors",
              index < currentStep ? "bg-primary-500" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// Empty States
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <motion.div
          className="mb-4 text-muted-foreground"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {icon}
        </motion.div>
      )}
      <motion.h3
        className="text-lg font-semibold text-foreground mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="text-muted-foreground mb-6 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {description}
      </motion.p>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

// Predefined Empty States
export function EmptyContentState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12" />}
      title="No content yet"
      description="Start creating amazing content for your social media campaigns. Your posts will appear here once you begin generating content."
      action={action}
    />
  )
}

export function EmptyCalendarState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={<Calendar className="h-12 w-12" />}
      title="No events scheduled"
      description="Your calendar is empty. Schedule your first social media post or campaign to get started with content planning."
      action={action}
    />
  )
}

export function EmptyClientsState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No clients added"
      description="Add your first client to start managing their social media presence and creating branded content."
      action={action}
    />
  )
}

export function EmptyAssetsState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon={<Image className="h-12 w-12" />}
      title="No assets uploaded"
      description="Upload brand assets like logos, images, and templates to enhance your content creation workflow."
      action={action}
    />
  )
}

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean
  children: ReactNode
  loadingText?: string
  className?: string
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  loadingText = "Loading...",
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}