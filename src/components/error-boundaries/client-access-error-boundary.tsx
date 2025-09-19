'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Users } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'

interface ClientAccessErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ClientAccessErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showRetry?: boolean
  showAdminDashboard?: boolean
}

export class ClientAccessErrorBoundary extends Component<
  ClientAccessErrorBoundaryProps,
  ClientAccessErrorBoundaryState
> {
  constructor(props: ClientAccessErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ClientAccessErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error for debugging
    console.error('Client Access Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoToAdminDashboard = () => {
    window.location.href = '/dashboard/admin'
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const error = this.state.error
      const isClientAccessError = error?.name === 'ClientAccessError'
      const isClientPermissionError = error?.name === 'ClientPermissionError'
      const isClientDataIsolationError = error?.name === 'ClientDataIsolationError'

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {isClientAccessError && 'Access Denied'}
                {isClientPermissionError && 'Permission Required'}
                {isClientDataIsolationError && 'Data Access Error'}
                {!isClientAccessError && !isClientPermissionError && !isClientDataIsolationError && 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isClientAccessError && 'You don\'t have permission to access this client workspace.'}
                {isClientPermissionError && 'You don\'t have the required permissions for this action.'}
                {isClientDataIsolationError && 'There was an issue accessing client data.'}
                {!isClientAccessError && !isClientPermissionError && !isClientDataIsolationError && 
                  'An unexpected error occurred while loading the client workspace.'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                {this.props.showRetry !== false && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}

                {this.props.showAdminDashboard !== false && (
                  <Button 
                    onClick={this.handleGoToAdminDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Go to Admin Dashboard
                  </Button>
                )}

                <Button 
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {error.name}
                    </div>
                    <div>
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useClientAccessErrorHandler() {
  const handleClientAccessError = (error: Error) => {
    if (error.name === 'ClientAccessError' || 
        error.name === 'ClientPermissionError' || 
        error.name === 'ClientDataIsolationError') {
      // You can customize error handling here
      console.error('Client access error:', error)
      
      // Could dispatch to a global error state, show toast, etc.
      // For now, we'll let the error boundary handle it
      throw error
    }
  }

  return { handleClientAccessError }
}

// Higher-order component version
export function withClientAccessErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ClientAccessErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ClientAccessErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ClientAccessErrorBoundary>
    )
  }
}