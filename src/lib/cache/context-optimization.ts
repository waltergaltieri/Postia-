/**
 * Context optimization utilities to minimize re-renders
 * Implements memoization and selective updates for navigation context
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { clientDataCache, permissionCache, sessionCache, CacheKeys, CacheUtils } from './client-cache'

// Debounce utility for context updates
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Memoized client data hook
export function useCachedClientData(clientId: string | null) {
  return useMemo(() => {
    if (!clientId) return null
    
    const cacheKey = CacheKeys.clientData(clientId)
    return clientDataCache.get(cacheKey)
  }, [clientId])
}

// Memoized permissions hook
export function useCachedPermissions(userId: string | null, clientId: string | null) {
  return useMemo(() => {
    if (!userId || !clientId) return []
    
    const cacheKey = CacheKeys.permissions(userId, clientId)
    return permissionCache.get<string[]>(cacheKey) || []
  }, [userId, clientId])
}

// Optimized client switching with caching
export function useOptimizedClientSwitching() {
  const switchingRef = useRef(false)
  const lastClientRef = useRef<string | null>(null)

  const switchToClientOptimized = useCallback(async (
    clientId: string,
    userId: string,
    originalSwitchFunction: (clientId: string) => Promise<void>
  ) => {
    // Prevent concurrent switches
    if (switchingRef.current) {
      return
    }

    // Skip if already on this client
    if (lastClientRef.current === clientId) {
      return
    }

    switchingRef.current = true
    
    try {
      // Check cache first for faster switching
      const cachedClient = clientDataCache.get(CacheKeys.clientData(clientId))
      const cachedPermissions = permissionCache.get(CacheKeys.permissions(userId, clientId))
      
      if (cachedClient && cachedPermissions) {
        // Fast path - use cached data
        lastClientRef.current = clientId
        // Update context immediately with cached data
        // The original function will still run but won't need to fetch
      }
      
      await originalSwitchFunction(clientId)
      lastClientRef.current = clientId
    } finally {
      switchingRef.current = false
    }
  }, [])

  return { switchToClientOptimized }
}

// Context state optimization
export interface OptimizedContextState {
  // Split context into smaller, focused pieces
  clientState: {
    currentClient: any
    selectedClientId: string | null
    clientWorkspaceMode: 'admin' | 'client'
  }
  
  permissionState: {
    clientPermissions: string[]
    isClientDataIsolated: boolean
  }
  
  sessionState: {
    persistClientSelection: boolean
    loading: boolean
  }
  
  navigationState: {
    breadcrumbs: any[]
    workflowStep: number
    totalSteps: number
  }
}

// Memoized context selectors to prevent unnecessary re-renders
export const contextSelectors = {
  clientState: (state: OptimizedContextState) => state.clientState,
  permissionState: (state: OptimizedContextState) => state.permissionState,
  sessionState: (state: OptimizedContextState) => state.sessionState,
  navigationState: (state: OptimizedContextState) => state.navigationState
}

// Optimized context update functions
export function createOptimizedContextUpdaters() {
  const updateQueue = useRef<Array<() => void>>([])
  const isUpdating = useRef(false)

  const queueUpdate = useCallback((updater: () => void) => {
    updateQueue.current.push(updater)
    
    if (!isUpdating.current) {
      isUpdating.current = true
      
      // Batch updates using requestAnimationFrame
      requestAnimationFrame(() => {
        const updates = updateQueue.current.splice(0)
        updates.forEach(update => update())
        isUpdating.current = false
      })
    }
  }, [])

  return { queueUpdate }
}

// Performance monitoring for context updates
export class ContextPerformanceMonitor {
  private renderCounts = new Map<string, number>()
  private renderTimes = new Map<string, number[]>()

  trackRender(componentName: string, renderTime: number) {
    // Track render count
    const count = this.renderCounts.get(componentName) || 0
    this.renderCounts.set(componentName, count + 1)

    // Track render times
    const times = this.renderTimes.get(componentName) || []
    times.push(renderTime)
    
    // Keep only last 100 render times
    if (times.length > 100) {
      times.shift()
    }
    
    this.renderTimes.set(componentName, times)
  }

  getStats(componentName: string) {
    const count = this.renderCounts.get(componentName) || 0
    const times = this.renderTimes.get(componentName) || []
    
    if (times.length === 0) {
      return { count, avgRenderTime: 0, maxRenderTime: 0 }
    }

    const avgRenderTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const maxRenderTime = Math.max(...times)

    return { count, avgRenderTime, maxRenderTime }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    
    for (const componentName of this.renderCounts.keys()) {
      stats[componentName] = this.getStats(componentName)
    }
    
    return stats
  }

  reset() {
    this.renderCounts.clear()
    this.renderTimes.clear()
  }
}

export const contextPerformanceMonitor = new ContextPerformanceMonitor()

// Hook for performance monitoring
export function useRenderTracking(componentName: string) {
  const renderStartTime = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
  })

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    contextPerformanceMonitor.trackRender(componentName, renderTime)
  })
}

// Optimized data fetching with caching
export async function fetchWithCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  cache: typeof clientDataCache,
  ttl?: number
): Promise<T> {
  return CacheUtils.getOrSet(cache, cacheKey, fetcher, ttl)
}

// Client data prefetching for better performance
export function usePrefetchClientData() {
  const prefetchedClients = useRef(new Set<string>())

  const prefetchClient = useCallback(async (clientId: string, userId: string) => {
    if (prefetchedClients.current.has(clientId)) {
      return
    }

    prefetchedClients.current.add(clientId)

    try {
      // Prefetch client data
      const clientKey = CacheKeys.clientData(clientId)
      if (!clientDataCache.has(clientKey)) {
        const clientResponse = await fetch(`/api/clients/${clientId}`)
        const clientData = await clientResponse.json()
        if (clientData.success) {
          clientDataCache.set(clientKey, clientData.data)
        }
      }

      // Prefetch permissions
      const permissionKey = CacheKeys.permissions(userId, clientId)
      if (!permissionCache.has(permissionKey)) {
        const permissionResponse = await fetch(`/api/clients/${clientId}/permissions`)
        const permissionData = await permissionResponse.json()
        if (permissionData.success) {
          permissionCache.set(permissionKey, permissionData.data.permissions)
        }
      }
    } catch (error) {
      console.error('Error prefetching client data:', error)
      prefetchedClients.current.delete(clientId)
    }
  }, [])

  return { prefetchClient }
}

// Import useState for useDebounce
import { useState } from 'react'