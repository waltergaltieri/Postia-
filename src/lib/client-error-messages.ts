import { ClientAccessError, ClientPermissionError, ClientDataIsolationError } from './client-isolation'

export interface ClientErrorMessage {
  title: string
  description: string
  action?: string
  severity: 'error' | 'warning' | 'info'
}

/**
 * Get user-friendly error messages for client access errors
 */
export function getClientErrorMessage(error: Error, context?: {
  clientId?: string
  clientName?: string
  requiredPermission?: string
  userRole?: string
}): ClientErrorMessage {
  const { clientId, clientName, requiredPermission, userRole } = context || {}

  // Handle ClientAccessError
  if (error instanceof ClientAccessError || error.name === 'ClientAccessError') {
    return {
      title: 'Access Denied',
      description: clientName 
        ? `You don't have permission to access the ${clientName} workspace. Please contact your administrator to request access.`
        : 'You don\'t have permission to access this client workspace. Please contact your administrator to request access.',
      action: 'Contact your administrator to request access to this client.',
      severity: 'error'
    }
  }

  // Handle ClientPermissionError
  if (error instanceof ClientPermissionError || error.name === 'ClientPermissionError') {
    const permissionText = requiredPermission ? ` "${requiredPermission}"` : ''
    const clientText = clientName ? ` for ${clientName}` : ''
    
    return {
      title: 'Permission Required',
      description: `You need the${permissionText} permission${clientText} to perform this action. Your current role (${userRole || 'unknown'}) doesn't include this permission.`,
      action: requiredPermission 
        ? `Request the "${requiredPermission}" permission from your administrator.`
        : 'Contact your administrator to request the necessary permissions.',
      severity: 'warning'
    }
  }

  // Handle ClientDataIsolationError
  if (error instanceof ClientDataIsolationError || error.name === 'ClientDataIsolationError') {
    return {
      title: 'Data Access Error',
      description: 'There was an issue accessing client data. This might be a temporary problem or a data isolation issue.',
      action: 'Try refreshing the page. If the problem persists, contact support.',
      severity: 'error'
    }
  }

  // Handle generic client-related errors
  if (error.message.toLowerCase().includes('client')) {
    return {
      title: 'Client Access Issue',
      description: 'An unexpected error occurred while accessing client data. This might be a temporary issue.',
      action: 'Try refreshing the page or switching to a different client.',
      severity: 'error'
    }
  }

  // Fallback for unknown errors
  return {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'Try refreshing the page or contact support.',
    severity: 'error'
  }
}

/**
 * Get specific error messages for different scenarios
 */
export const ClientErrorMessages = {
  // Access denied scenarios
  ACCESS_DENIED: {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this client workspace.',
    action: 'Contact your administrator to request access.',
    severity: 'error' as const
  },

  CLIENT_NOT_FOUND: {
    title: 'Client Not Found',
    description: 'The requested client workspace could not be found or may have been removed.',
    action: 'Check the client ID or contact your administrator.',
    severity: 'error' as const
  },

  CLIENT_INACTIVE: {
    title: 'Client Inactive',
    description: 'This client workspace is currently inactive and cannot be accessed.',
    action: 'Contact your administrator to reactivate this client.',
    severity: 'warning' as const
  },

  // Permission scenarios
  INSUFFICIENT_PERMISSIONS: {
    title: 'Insufficient Permissions',
    description: 'You don\'t have the required permissions to perform this action.',
    action: 'Contact your administrator to request additional permissions.',
    severity: 'warning' as const
  },

  ROLE_RESTRICTION: {
    title: 'Role Restriction',
    description: 'Your current role doesn\'t allow access to this feature.',
    action: 'Contact your administrator about upgrading your role.',
    severity: 'warning' as const
  },

  // Data isolation scenarios
  DATA_ISOLATION_VIOLATION: {
    title: 'Data Access Error',
    description: 'There was an issue with data isolation. This is a security measure to protect client data.',
    action: 'Try refreshing the page. Contact support if the issue persists.',
    severity: 'error' as const
  },

  CROSS_CLIENT_ACCESS: {
    title: 'Cross-Client Access Denied',
    description: 'You cannot access data from multiple clients simultaneously.',
    action: 'Switch to the appropriate client workspace first.',
    severity: 'warning' as const
  },

  // Session and authentication scenarios
  SESSION_EXPIRED: {
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again to continue.',
    action: 'Log in again to access your client workspaces.',
    severity: 'info' as const
  },

  INVALID_CLIENT_SESSION: {
    title: 'Invalid Client Session',
    description: 'Your client session is invalid or has expired.',
    action: 'Try switching to the client workspace again.',
    severity: 'warning' as const
  },

  // Network and system errors
  NETWORK_ERROR: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your connection and try again.',
    severity: 'error' as const
  },

  SERVER_ERROR: {
    title: 'Server Error',
    description: 'A server error occurred while processing your request.',
    action: 'Try again in a few moments. Contact support if the issue persists.',
    severity: 'error' as const
  }
}

/**
 * Get error message by error code or type
 */
export function getErrorMessageByCode(
  errorCode: keyof typeof ClientErrorMessages,
  context?: {
    clientName?: string
    requiredPermission?: string
    userRole?: string
  }
): ClientErrorMessage {
  const baseMessage = ClientErrorMessages[errorCode]
  const { clientName, requiredPermission, userRole } = context || {}

  // Customize messages based on context
  let description = baseMessage.description
  let action = baseMessage.action

  if (clientName) {
    description = description.replace('this client', `the ${clientName} client`)
    description = description.replace('client workspace', `${clientName} workspace`)
  }

  if (requiredPermission) {
    description = description.replace('required permissions', `"${requiredPermission}" permission`)
    action = action.replace('additional permissions', `the "${requiredPermission}" permission`)
  }

  if (userRole) {
    description = description.replace('Your current role', `Your current role (${userRole})`)
  }

  return {
    ...baseMessage,
    description,
    action
  }
}

/**
 * Format error for display in UI components
 */
export function formatClientError(error: Error, context?: {
  clientId?: string
  clientName?: string
  requiredPermission?: string
  userRole?: string
}): {
  message: ClientErrorMessage
  details: {
    errorName: string
    errorMessage: string
    clientId?: string
    timestamp: string
  }
} {
  const message = getClientErrorMessage(error, context)
  
  return {
    message,
    details: {
      errorName: error.name,
      errorMessage: error.message,
      clientId: context?.clientId,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Check if error is client-related
 */
export function isClientError(error: Error): boolean {
  return (
    error instanceof ClientAccessError ||
    error instanceof ClientPermissionError ||
    error instanceof ClientDataIsolationError ||
    error.name === 'ClientAccessError' ||
    error.name === 'ClientPermissionError' ||
    error.name === 'ClientDataIsolationError' ||
    error.message.toLowerCase().includes('client')
  )
}

/**
 * Get severity level for error
 */
export function getErrorSeverity(error: Error): 'error' | 'warning' | 'info' {
  if (error instanceof ClientPermissionError || error.name === 'ClientPermissionError') {
    return 'warning'
  }
  
  if (error.message.toLowerCase().includes('session') || 
      error.message.toLowerCase().includes('expired')) {
    return 'info'
  }
  
  return 'error'
}

/**
 * Get suggested actions for error recovery
 */
export function getErrorRecoveryActions(error: Error, context?: {
  clientId?: string
  clientName?: string
  canRetry?: boolean
  canGoBack?: boolean
}): Array<{
  label: string
  action: string
  primary?: boolean
}> {
  const { canRetry = true, canGoBack = true } = context || {}
  const actions: Array<{ label: string; action: string; primary?: boolean }> = []

  // Add retry action for recoverable errors
  if (canRetry && (
    error instanceof ClientDataIsolationError ||
    error.name === 'ClientDataIsolationError' ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('server')
  )) {
    actions.push({
      label: 'Try Again',
      action: 'retry',
      primary: true
    })
  }

  // Add navigation actions
  actions.push({
    label: 'Go to Admin Dashboard',
    action: 'admin-dashboard'
  })

  if (canGoBack) {
    actions.push({
      label: 'Go Back',
      action: 'go-back'
    })
  }

  actions.push({
    label: 'Go to Dashboard',
    action: 'dashboard'
  })

  // Add contact support for access errors
  if (error instanceof ClientAccessError || 
      error instanceof ClientPermissionError ||
      error.name === 'ClientAccessError' ||
      error.name === 'ClientPermissionError') {
    actions.push({
      label: 'Contact Support',
      action: 'contact-support'
    })
  }

  return actions
}