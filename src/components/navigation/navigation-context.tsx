'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import { 
  validateClientAccess, 
  getUserAccessibleClientIds,
  parseClientPermissions,
  ClientAccessError 
} from '../../lib/client-isolation'
import { 
  ClientSelectionStorage,
  createOrUpdateClientSession,
  getRecentClientsForUser 
} from '../../lib/client-session'
import { UserRole } from '../../generated/prisma'
import { 
  clientDataCache, 
  permissionCache, 
  sessionCache, 
  CacheKeys, 
  CacheUtils 
} from '../../lib/cache/client-cache'
import { 
  useOptimizedClientSwitching,
  usePrefetchClientData,
  useRenderTracking,
  fetchWithCache
} from '../../lib/cache/context-optimization'

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  metadata?: {
    clientName?: string
    campaignName?: string
    contentType?: string
    status?: string
  }
}

interface NavigationContextType {
  // Client Management
  currentClient: Client | null
  setCurrentClient: (client: Client | null) => void
  clients: Client[]
  setClients: (clients: Client[]) => void
  
  // Enhanced Client Management Features
  selectedClientId: string | null
  clientWorkspaceMode: 'admin' | 'client'
  switchToClient: (clientId: string) => Promise<void>
  switchToAdminDashboard: () => void
  
  // Client-specific data isolation
  isClientDataIsolated: boolean
  clientPermissions: string[]
  
  // Session persistence
  persistClientSelection: boolean
  restoreLastClient: () => Promise<void>
  
  // Campaign Management
  currentCampaign: Campaign | null
  setCurrentCampaign: (campaign: Campaign | null) => void
  
  // Breadcrumb Management
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
  addBreadcrumb: (item: BreadcrumbItem) => void
  removeBreadcrumb: (href: string) => void
  
  // Workflow State
  workflowStep: number
  totalSteps: number
  setWorkflowProgress: (step: number, total: number) => void
  
  // Loading States
  loading: boolean
  setLoading: (loading: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { data: session } = useSession()
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [workflowStep, setWorkflowStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Enhanced client management state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientWorkspaceMode, setClientWorkspaceMode] = useState<'admin' | 'client'>('admin')
  const [clientPermissions, setClientPermissions] = useState<string[]>([])
  const [isClientDataIsolated, setIsClientDataIsolated] = useState(false)
  const [persistClientSelection] = useState(true) // Always persist for better UX

  // Performance optimization hooks
  useRenderTracking('NavigationProvider')
  const { switchToClientOptimized } = useOptimizedClientSwitching()
  const { prefetchClient } = usePrefetchClientData()

  // Enhanced client management functions with caching
  const switchToClient = useCallback(async (clientId: string): Promise<void> => {
    if (!session?.user?.id || !session?.user?.role) {
      throw new ClientAccessError('unknown', clientId, 'No valid session')
    }

    try {
      // Check cache first for faster switching
      const cachedClient = clientDataCache.get(CacheKeys.clientData(clientId))
      const cachedPermissions = permissionCache.get<string[]>(CacheKeys.permissions(session.user.id, clientId))

      // Validate client access (use cached result if available)
      const accessCacheKey = `access:${session.user.id}:${clientId}`
      const hasAccess = await fetchWithCache(
        accessCacheKey,
        () => validateClientAccess(session.user.id, session.user.role as UserRole, clientId),
        sessionCache,
        2 * 60 * 1000 // 2 minutes TTL for access validation
      )

      if (!hasAccess) {
        throw new ClientAccessError(session.user.id, clientId)
      }

      // Find client in current clients list or cache
      let client = clients.find(c => c.id === clientId)
      if (!client && cachedClient) {
        client = cachedClient
      }
      
      if (!client) {
        throw new ClientAccessError(session.user.id, clientId, 'Client not found in accessible clients')
      }

      // Update client selection
      setSelectedClientId(clientId)
      setCurrentClient(client)
      setClientWorkspaceMode('client')
      setIsClientDataIsolated(true)

      // Update client permissions (use cached if available)
      if (cachedPermissions) {
        setClientPermissions(cachedPermissions)
      } else {
        await updateClientPermissions(clientId)
      }

      // Persist selection if enabled
      if (persistClientSelection) {
        ClientSelectionStorage.saveClientSelection(clientId)
        await persistClientSelectionToServer(clientId)
        
        // Cache session data
        const sessionData = {
          lastRoute: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
        
        sessionCache.set(CacheKeys.clientSession(session.user.id, clientId), sessionData)
        
        await createOrUpdateClientSession(session.user.id, clientId, sessionData)
      }

      // Clear campaign selection when switching clients
      setCurrentCampaign(null)
    } catch (error) {
      console.error('Error switching to client:', error)
      throw error
    }
  }, [session?.user?.id, session?.user?.role, clients, persistClientSelection])

  const switchToAdminDashboard = useCallback((): void => {
    setSelectedClientId(null)
    setCurrentClient(null)
    setClientWorkspaceMode('admin')
    setIsClientDataIsolated(false)
    setClientPermissions([])
    setCurrentCampaign(null)

    // Clear persisted selection
    if (persistClientSelection) {
      ClientSelectionStorage.clearClientSelection()
      persistClientSelectionToServer(null)
    }
  }, [persistClientSelection])

  const updateClientPermissions = useCallback(async (clientId: string): Promise<void> => {
    if (!session?.user?.id) return

    try {
      const cacheKey = CacheKeys.permissions(session.user.id, clientId)
      
      const permissions = await fetchWithCache(
        cacheKey,
        async () => {
          const response = await fetch(`/api/clients/${clientId}/permissions`)
          const result = await response.json()
          return result.success ? result.data.permissions : []
        },
        permissionCache,
        5 * 60 * 1000 // 5 minutes TTL for permissions
      )
      
      setClientPermissions(permissions)
    } catch (error) {
      console.error('Error fetching client permissions:', error)
      setClientPermissions([])
    }
  }, [session?.user?.id])

  const persistClientSelectionToServer = async (clientId: string | null): Promise<void> => {
    if (!session?.user?.id) return

    try {
      await fetch('/api/user/client-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })
    } catch (error) {
      console.error('Error persisting client selection:', error)
    }
  }

  const restoreLastClient = useCallback(async (): Promise<void> => {
    if (!session?.user?.id || !persistClientSelection) return

    try {
      // Try to get from cache first (fastest)
      const sessionCacheKey = `last-client:${session.user.id}`
      let clientId = sessionCache.get<string>(sessionCacheKey)
      
      if (!clientId) {
        // Try localStorage next
        clientId = ClientSelectionStorage.getClientSelection()
        
        if (!clientId) {
          // Finally try server
          const response = await fetch('/api/user/client-selection')
          const result = await response.json()
          clientId = result.success ? result.data.lastSelectedClient : null
        }
        
        // Cache the result for next time
        if (clientId) {
          sessionCache.set(sessionCacheKey, clientId, 30 * 60 * 1000) // 30 minutes
        }
      }

      if (clientId && clients.some(c => c.id === clientId)) {
        await switchToClient(clientId)
      } else if (clients.length > 0) {
        // If no valid stored client, but clients exist, stay in admin mode
        switchToAdminDashboard()
      }
    } catch (error) {
      console.error('Error restoring last client:', error)
      // Fallback to admin dashboard on error
      switchToAdminDashboard()
    }
  }, [session?.user?.id, persistClientSelection, clients, switchToClient, switchToAdminDashboard])

  // Fetch clients on session load with caching
  useEffect(() => {
    const fetchClients = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const cacheKey = CacheKeys.clientList(session.user.id)
        
        const clientsData = await fetchWithCache(
          cacheKey,
          async () => {
            const response = await fetch('/api/clients')
            const result = await response.json()
            
            if (result.success && result.data.clients.length > 0) {
              return result.data.clients.map((client: any) => ({
                id: client.id,
                brandName: client.name || client.brandName,
                brandColors: client.brandColors ? JSON.parse(client.brandColors) : ['#3b82f6'],
                logoUrl: client.logoUrl
              }))
            }
            return []
          },
          clientDataCache,
          10 * 60 * 1000 // 10 minutes TTL for client list
        )
        
        setClients(clientsData)
        
        // Prefetch data for first few clients
        if (clientsData.length > 0) {
          const topClients = clientsData.slice(0, 3)
          topClients.forEach(client => {
            prefetchClient(client.id, session.user.id)
          })
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [session, prefetchClient])

  // Restore last client selection after clients are loaded
  useEffect(() => {
    if (!loading && clients.length > 0 && !selectedClientId) {
      restoreLastClient()
    }
  }, [loading, clients.length, selectedClientId])

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      // Remove existing item with same href
      const filtered = prev.filter(b => b.href !== item.href)
      return [...filtered, item]
    })
  }

  const removeBreadcrumb = (href: string) => {
    setBreadcrumbs(prev => prev.filter(b => b.href !== href))
  }

  const setWorkflowProgress = (step: number, total: number) => {
    setWorkflowStep(step)
    setTotalSteps(total)
  }

  // Memoized context value to prevent unnecessary re-renders
  const value: NavigationContextType = useMemo(() => ({
    currentClient,
    setCurrentClient,
    clients,
    setClients,
    
    // Enhanced client management features
    selectedClientId,
    clientWorkspaceMode,
    switchToClient,
    switchToAdminDashboard,
    
    // Client-specific data isolation
    isClientDataIsolated,
    clientPermissions,
    
    // Session persistence
    persistClientSelection,
    restoreLastClient,
    
    currentCampaign,
    setCurrentCampaign,
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    workflowStep,
    totalSteps,
    setWorkflowProgress,
    loading,
    setLoading
  }), [
    currentClient,
    clients,
    selectedClientId,
    clientWorkspaceMode,
    switchToClient,
    switchToAdminDashboard,
    isClientDataIsolated,
    clientPermissions,
    persistClientSelection,
    restoreLastClient,
    currentCampaign,
    breadcrumbs,
    workflowStep,
    totalSteps,
    loading
  ])

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Convenience hooks
export function useCurrentClient() {
  const { currentClient, setCurrentClient } = useNavigation()
  return { currentClient, setCurrentClient }
}

export function useClients() {
  const { clients, setClients } = useNavigation()
  return { clients, setClients }
}

export function useWorkflowProgress() {
  const { workflowStep, totalSteps, setWorkflowProgress } = useNavigation()
  return { workflowStep, totalSteps, setWorkflowProgress }
}

// Enhanced client management hooks
export function useClientManagement() {
  const { 
    selectedClientId, 
    clientWorkspaceMode, 
    switchToClient, 
    switchToAdminDashboard,
    isClientDataIsolated,
    clientPermissions
  } = useNavigation()
  
  return { 
    selectedClientId, 
    clientWorkspaceMode, 
    switchToClient, 
    switchToAdminDashboard,
    isClientDataIsolated,
    clientPermissions
  }
}

export function useClientPermissions() {
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
  
  return {
    clientPermissions,
    selectedClientId,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}

export function useClientSession() {
  const { persistClientSelection, restoreLastClient } = useNavigation()
  return { persistClientSelection, restoreLastClient }
}

export function useRecentClients() {
  const [recentClients, setRecentClients] = useState<Array<{
    clientId: string
    clientName: string
    lastAccessed: Date
  }>>([])
  const { data: session } = useSession()

  useEffect(() => {
    const fetchRecentClients = async () => {
      if (!session?.user?.id) return

      try {
        const cacheKey = CacheKeys.recentClients(session.user.id)
        
        const recent = await fetchWithCache(
          cacheKey,
          () => getRecentClientsForUser(session.user.id, 5),
          sessionCache,
          5 * 60 * 1000 // 5 minutes TTL for recent clients
        )
        
        setRecentClients(recent)
      } catch (error) {
        console.error('Error fetching recent clients:', error)
      }
    }

    fetchRecentClients()
  }, [session?.user?.id])

  return useMemo(() => ({ recentClients }), [recentClients])
}