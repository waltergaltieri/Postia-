'use client'

import React, { ComponentType, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useNavigation } from '../navigation/navigation-context'
import { validateClientAccess, ClientAccessError, ClientPermissionError } from '../../lib/client-isolation'
import { ClientAccessFallback } from './client-access-fallback'
import { UserRole } from '../../generated/prisma'

interface ClientAccessProtectionOptions {
  clientId?: string
  requiredPermissions?: string[]
  fallbackComponent?: ComponentType<any>
  redirectOnError?: boolean
  showLoading?: boolean
}

interface WithClientAccessProtectionProps {
  clientId?: string
  requiredPermissions?: string[]
}

/**
 * Higher-order component that protects components with client access validation
 */
export function withClientAccessProtection<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ClientAccessProtectionOptions = {}
) {
  return function ClientAccessProtectedComponent(
    props: P & WithClientAccessProtectionProps
  ) {
    const { data: session, status } = useSession()
    const { selectedClientId, clientPermissions } = useNavigation()
    const [accessError, setAccessError] = useState<Error | null>(null)
    const [isValidating, setIsValidating] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)

    // Determine which client ID to use
    const targetClientId = props.clientId || options.clientId || selectedClientId

    // Determine required permissions
    const requiredPermissions = props.requiredPermissions || options.requiredPermissions || []

    useEffect(() => {
      const validateAccess = async () => {
        if (status === 'loading') return
        
        if (!session?.user?.id || !session?.user?.role) {
          setAccessError(new ClientAccessError('unknown', targetClientId || 'unknown', 'No valid session'))
          setIsValidating(false)
          return
        }

        if (!targetClientId) {
          // If no client ID is specified, allow access (for admin views, etc.)
          setHasAccess(true)
          setIsValidating(false)
          return
        }

        try {
          // Validate client access
          const hasClientAccess = await validateClientAccess(
            session.user.id,
            session.user.role as UserRole,
            targetClientId
          )

          if (!hasClientAccess) {
            setAccessError(new ClientAccessError(session.user.id, targetClientId))
            setIsValidating(false)
            return
          }

          // Validate permissions if required
          if (requiredPermissions.length > 0) {
            const hasAllPermissions = requiredPermissions.every(permission =>
              clientPermissions.includes(permission)
            )

            if (!hasAllPermissions) {
              const missingPermissions = requiredPermissions.filter(permission =>
                !clientPermissions.includes(permission)
              )
              setAccessError(new ClientPermissionError(
                session.user.id,
                targetClientId,
                missingPermissions.join(', ')
              ))
              setIsValidating(false)
              return
            }
          }

          // All validations passed
          setHasAccess(true)
          setAccessError(null)
        } catch (error) {
          console.error('Error validating client access:', error)
          setAccessError(error instanceof Error ? error : new Error('Unknown validation error'))
        } finally {
          setIsValidating(false)
        }
      }

      validateAccess()
    }, [session, status, targetClientId, requiredPermissions, clientPermissions])

    // Handle redirect on error
    useEffect(() => {
      if (options.redirectOnError && accessError && !isValidating) {
        if (accessError.name === 'ClientAccessError') {
          window.location.href = '/dashboard/admin'
        } else if (accessError.name === 'ClientPermissionError') {
          window.location.href = '/dashboard'
        }
      }
    }, [accessError, isValidating, options.redirectOnError])

    // Show loading state
    if (isValidating && options.showLoading !== false) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    // Show error state
    if (accessError) {
      const FallbackComponent = options.fallbackComponent || ClientAccessFallback
      return (
        <FallbackComponent
          error={accessError}
          clientId={targetClientId}
          requiredPermission={requiredPermissions.join(', ')}
        />
      )
    }

    // Show protected component
    if (hasAccess) {
      return <WrappedComponent {...props} />
    }

    // Fallback loading state
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
}

/**
 * Hook for client access validation
 */
export function useClientAccessValidation(
  clientId?: string,
  requiredPermissions: string[] = []
) {
  const { data: session } = useSession()
  const { selectedClientId, clientPermissions } = useNavigation()
  const [validationState, setValidationState] = useState<{
    isValidating: boolean
    hasAccess: boolean
    error: Error | null
  }>({
    isValidating: true,
    hasAccess: false,
    error: null
  })

  const targetClientId = clientId || selectedClientId

  useEffect(() => {
    const validateAccess = async () => {
      if (!session?.user?.id || !session?.user?.role) {
        setValidationState({
          isValidating: false,
          hasAccess: false,
          error: new ClientAccessError('unknown', targetClientId || 'unknown', 'No valid session')
        })
        return
      }

      if (!targetClientId) {
        setValidationState({
          isValidating: false,
          hasAccess: true,
          error: null
        })
        return
      }

      try {
        const hasClientAccess = await validateClientAccess(
          session.user.id,
          session.user.role as UserRole,
          targetClientId
        )

        if (!hasClientAccess) {
          setValidationState({
            isValidating: false,
            hasAccess: false,
            error: new ClientAccessError(session.user.id, targetClientId)
          })
          return
        }

        if (requiredPermissions.length > 0) {
          const hasAllPermissions = requiredPermissions.every(permission =>
            clientPermissions.includes(permission)
          )

          if (!hasAllPermissions) {
            const missingPermissions = requiredPermissions.filter(permission =>
              !clientPermissions.includes(permission)
            )
            setValidationState({
              isValidating: false,
              hasAccess: false,
              error: new ClientPermissionError(
                session.user.id,
                targetClientId,
                missingPermissions.join(', ')
              )
            })
            return
          }
        }

        setValidationState({
          isValidating: false,
          hasAccess: true,
          error: null
        })
      } catch (error) {
        setValidationState({
          isValidating: false,
          hasAccess: false,
          error: error instanceof Error ? error : new Error('Unknown validation error')
        })
      }
    }

    validateAccess()
  }, [session, targetClientId, requiredPermissions, clientPermissions])

  return validationState
}

/**
 * Component that conditionally renders children based on client access
 */
interface ClientAccessGateProps {
  clientId?: string
  requiredPermissions?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function ClientAccessGate({
  clientId,
  requiredPermissions = [],
  fallback,
  children
}: ClientAccessGateProps) {
  const { isValidating, hasAccess, error } = useClientAccessValidation(clientId, requiredPermissions)

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <ClientAccessFallback
        error={error || new Error('Access denied')}
        clientId={clientId}
        requiredPermission={requiredPermissions.join(', ')}
      />
    )
  }

  return <>{children}</>
}

/**
 * Hook for checking specific permissions
 */
export function useClientPermissionCheck() {
  const { clientPermissions, selectedClientId } = useNavigation()

  const hasPermission = (permission: string): boolean => {
    return clientPermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => clientPermissions.includes(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => clientPermissions.includes(permission))
  }

  const requirePermission = (permission: string): void => {
    if (!hasPermission(permission)) {
      throw new ClientPermissionError(
        'current-user',
        selectedClientId || 'unknown',
        permission
      )
    }
  }

  const requireAnyPermission = (permissions: string[]): void => {
    if (!hasAnyPermission(permissions)) {
      throw new ClientPermissionError(
        'current-user',
        selectedClientId || 'unknown',
        permissions.join(' or ')
      )
    }
  }

  const requireAllPermissions = (permissions: string[]): void => {
    if (!hasAllPermissions(permissions)) {
      const missing = permissions.filter(p => !hasPermission(p))
      throw new ClientPermissionError(
        'current-user',
        selectedClientId || 'unknown',
        missing.join(', ')
      )
    }
  }

  return {
    clientPermissions,
    selectedClientId,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions
  }
}