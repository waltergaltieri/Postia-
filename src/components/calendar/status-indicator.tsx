'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Edit3, 
  Clock, 
  CheckCircle, 
  Send, 
  AlertTriangle,
  Circle
} from 'lucide-react'
import { CalendarEvent } from './calendar-view'
import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
  status: CalendarEvent['status']
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  draft: {
    label: 'Borrador',
    icon: Edit3,
    color: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dotColor: 'bg-neutral-400',
    description: 'En proceso de creación'
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-warning-50 text-warning-700 border-warning-200',
    dotColor: 'bg-warning-500',
    description: 'Esperando aprobación'
  },
  approved: {
    label: 'Aprobado',
    icon: CheckCircle,
    color: 'bg-success-50 text-success-700 border-success-200',
    dotColor: 'bg-success-500',
    description: 'Listo para publicar'
  },
  published: {
    label: 'Publicado',
    icon: Send,
    color: 'bg-primary-50 text-primary-700 border-primary-200',
    dotColor: 'bg-primary-500',
    description: 'Contenido en vivo'
  },
  error: {
    label: 'Error',
    icon: AlertTriangle,
    color: 'bg-error-50 text-error-700 border-error-200',
    dotColor: 'bg-error-500',
    description: 'Requiere atención'
  }
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = true, 
  showIcon = true,
  className 
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
      dot: 'h-2 w-2'
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
      dot: 'h-2.5 w-2.5'
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      dot: 'h-3 w-3'
    }
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        config.color,
        sizeClasses[size].container,
        className
      )}
    >
      {showIcon && (
        <Icon className={sizeClasses[size].icon} />
      )}
      
      {!showIcon && (
        <div className={cn(
          "rounded-full",
          config.dotColor,
          sizeClasses[size].dot
        )} />
      )}
      
      {showLabel && (
        <span>{config.label}</span>
      )}
    </motion.div>
  )
}

// Status Dot Component for compact displays
interface StatusDotProps {
  status: CalendarEvent['status']
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function StatusDot({ status, size = 'md', className, showTooltip = true }: StatusDotProps) {
  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  }

  return (
    <div className="relative group">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "rounded-full",
          config.dotColor,
          sizeClasses[size],
          className
        )}
      />
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {config.label} - {config.description}
        </div>
      )}
    </div>
  )
}

// Status Progress Bar
interface StatusProgressProps {
  statuses: CalendarEvent['status'][]
  className?: string
}

export function StatusProgress({ statuses, className }: StatusProgressProps) {
  const statusOrder: CalendarEvent['status'][] = ['draft', 'pending', 'approved', 'published']
  const statusCounts = statusOrder.reduce((acc, status) => {
    acc[status] = statuses.filter(s => s === status).length
    return acc
  }, {} as Record<CalendarEvent['status'], number>)

  const total = statuses.length
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm text-neutral-600">
        <span>Progreso del contenido</span>
        <span>{total} elementos</span>
      </div>
      
      <div className="flex h-2 bg-neutral-200 rounded-full overflow-hidden">
        {statusOrder.map((status) => {
          const count = statusCounts[status]
          const percentage = total > 0 ? (count / total) * 100 : 0
          const config = statusConfig[status]
          
          if (count === 0) return null
          
          return (
            <motion.div
              key={status}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={config.dotColor}
              title={`${config.label}: ${count} elementos`}
            />
          )
        })}
      </div>
      
      <div className="flex justify-between text-xs text-neutral-500">
        {statusOrder.map((status) => {
          const count = statusCounts[status]
          const config = statusConfig[status]
          
          return (
            <div key={status} className="flex items-center gap-1">
              <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
              <span>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}