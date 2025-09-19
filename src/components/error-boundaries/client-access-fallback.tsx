'use client'

import React from 'react'
import { AlertTriangle, Users, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { useRouter } from 'next/navigation'
import { useNavigation } from '../navigation/navigation-context'

interface ClientAccessFallbackProps {
  error?: Error
  clientId?: string
  clientName?: string
  requiredPermission?: string
  showRetry?: boolean
  onRetry?: () => void
}

export function ClientAccessFallback({
  error,
  clientId,
  clientName,
  requiredPermission,
  showRetry = true,
  onRetry
}: ClientAccessFallbackProps) {
  const router = useRouter()
  const { switchToAdminDashboard } = useNavigation()

  const isClientAccessError = error?.name === 'ClientAccessError'
  const isClientPermissionError = error?.name === 'ClientPermissionError'
  const isClientDataIsolationError = error?.name === 'ClientDataIsolationError'

  const handleGoToAdminDashboard = () => {
    switchToAdminDashboard()
    router.push('/dashboard/admin')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const getErrorTitle = () => {
    if (isClientAccessError) return 'Access Denied'
    if (isClientPermissionError) return 'Permission Required'
    if (isClientDataIsolationError) return 'Data Access Error'
    return 'Client Access Error'
  }

  const getErrorDescription = () => {
    if (isClientAccessError) {
      return clientName 
        ? `You don't have permission to access the ${clientName} workspace.`
        : 'You don\'t have permission to access this client workspace.'
    }
    if (isClientPermissionError) {
      return requiredPermission
        ? `You need the "${requiredPermission}" permission to perform this action.`
        : 'You don\'t have the required permissions for this action.'
    }
    if (isClientDataIsolationError) {
      return 'There was an issue accessing client data. Please try again or contact support.'
    }
    return 'An error occurred while trying to access the client workspace.'
  }

  const getErrorMessage = () => {
    if (error?.message) return error.message
    return 'Please contact your administrator if you believe you should have access.'
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            {getErrorTitle()}
          </CardTitle>
          <CardDescription className="text-base">
            {getErrorDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getErrorMessage()}
            </AlertDescription>
          </Alert>

          {clientId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Client ID:</strong> {clientId}</div>
                {clientName && <div><strong>Client Name:</strong> {clientName}</div>}
                {requiredPermission && <div><strong>Required Permission:</strong> {requiredPermission}</div>}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {showRetry && onRetry && (
              <Button 
                onClick={onRetry}
                variant="default"
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            <Button 
              onClick={handleGoToAdminDashboard}
              variant="outline"
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Go to Admin Dashboard
            </Button>

            <div className="flex gap-2">
              <Button 
                onClick={handleGoBack}
                variant="ghost"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              <Button 
                onClick={handleGoHome}
                variant="ghost"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact your administrator or{' '}
              <a href="/support" className="text-blue-600 hover:underline">
                support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific fallback components for different error types
export function ClientAccessDeniedFallback({ clientId, clientName }: { clientId?: string; clientName?: string }) {
  return (
    <ClientAccessFallback
      error={new Error('Access denied to client workspace')}
      clientId={clientId}
      clientName={clientName}
      showRetry={false}
    />
  )
}

export function ClientPermissionDeniedFallback({ 
  clientId, 
  clientName, 
  requiredPermission 
}: { 
  clientId?: string; 
  clientName?: string; 
  requiredPermission?: string 
}) {
  return (
    <ClientAccessFallback
      error={new Error('Insufficient permissions for this action')}
      clientId={clientId}
      clientName={clientName}
      requiredPermission={requiredPermission}
      showRetry={false}
    />
  )
}

export function ClientDataIsolationFallback({ 
  clientId, 
  clientName, 
  onRetry 
}: { 
  clientId?: string; 
  clientName?: string; 
  onRetry?: () => void 
}) {
  return (
    <ClientAccessFallback
      error={new Error('Data isolation error occurred')}
      clientId={clientId}
      clientName={clientName}
      showRetry={true}
      onRetry={onRetry}
    />
  )
}