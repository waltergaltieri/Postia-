'use client'

import React from 'react'
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { getClientErrorMessage, type ClientErrorMessage } from '../../lib/client-error-messages'

interface ClientErrorToastProps {
  error: Error
  context?: {
    clientId?: string
    clientName?: string
    requiredPermission?: string
    userRole?: string
  }
  onDismiss?: () => void
  onAction?: (action: string) => void
  autoHide?: boolean
  duration?: number
}

export function ClientErrorToast({
  error,
  context,
  onDismiss,
  onAction,
  autoHide = true,
  duration = 5000
}: ClientErrorToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const errorMessage = getClientErrorMessage(error, context)

  React.useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoHide, duration, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleAction = (action: string) => {
    onAction?.(action)
  }

  const getIcon = (severity: ClientErrorMessage['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />
    }
  }

  const getBorderColor = (severity: ClientErrorMessage['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
        return 'border-l-blue-500'
      default:
        return 'border-l-red-500'
    }
  }

  if (!isVisible) return null

  return (
    <Card className={`w-full max-w-md border-l-4 ${getBorderColor(errorMessage.severity)} shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(errorMessage.severity)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm">
              {errorMessage.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {errorMessage.description}
            </p>
            
            {errorMessage.action && (
              <p className="text-xs text-gray-500 mt-2">
                {errorMessage.action}
              </p>
            )}

            {context?.clientName && (
              <div className="mt-2 text-xs text-gray-500">
                Client: {context.clientName}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Action buttons for specific error types */}
        {(error.name === 'ClientAccessError' || error.name === 'ClientPermissionError') && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('admin-dashboard')}
              className="text-xs"
            >
              Admin Dashboard
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction('contact-support')}
              className="text-xs"
            >
              Contact Support
            </Button>
          </div>
        )}

        {error.name === 'ClientDataIsolationError' && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('retry')}
              className="text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Toast container component
interface ClientErrorToastContainerProps {
  errors: Array<{
    id: string
    error: Error
    context?: {
      clientId?: string
      clientName?: string
      requiredPermission?: string
      userRole?: string
    }
  }>
  onDismiss: (id: string) => void
  onAction: (id: string, action: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function ClientErrorToastContainer({
  errors,
  onDismiss,
  onAction,
  position = 'top-right'
}: ClientErrorToastContainerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (errors.length === 0) return null

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {errors.map(({ id, error, context }) => (
        <ClientErrorToast
          key={id}
          error={error}
          context={context}
          onDismiss={() => onDismiss(id)}
          onAction={(action) => onAction(id, action)}
        />
      ))}
    </div>
  )
}

// Hook for managing client error toasts
export function useClientErrorToasts() {
  const [errors, setErrors] = React.useState<Array<{
    id: string
    error: Error
    context?: {
      clientId?: string
      clientName?: string
      requiredPermission?: string
      userRole?: string
    }
  }>>([])

  const showError = React.useCallback((
    error: Error,
    context?: {
      clientId?: string
      clientName?: string
      requiredPermission?: string
      userRole?: string
    }
  ) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setErrors(prev => [...prev, { id, error, context }])
  }, [])

  const dismissError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const handleAction = React.useCallback((id: string, action: string) => {
    // Handle different actions
    switch (action) {
      case 'admin-dashboard':
        window.location.href = '/dashboard/admin'
        break
      case 'dashboard':
        window.location.href = '/dashboard'
        break
      case 'contact-support':
        window.location.href = '/support'
        break
      case 'retry':
        // Dismiss the error and let the component retry
        dismissError(id)
        window.location.reload()
        break
      default:
        break
    }
    
    // Dismiss the error after action
    dismissError(id)
  }, [dismissError])

  const clearAllErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  return {
    errors,
    showError,
    dismissError,
    handleAction,
    clearAllErrors
  }
}