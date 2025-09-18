/**
 * Tour memory manager for efficient cleanup and memory usage optimization
 * Handles tour lifecycle, memory monitoring, and resource cleanup
 */

import type { TourDefinition } from '@/types/tour'

interface TourInstance {
  id: string
  tour: TourDefinition
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  memoryUsage: number
  isActive: boolean
  cleanup?: () => void
}

interface MemoryStats {
  totalInstances: number
  activeInstances: number
  totalMemoryUsage: number
  averageMemoryPerTour: number
  oldestInstance?: Date
  memoryPressure: 'low' | 'medium' | 'high'
}

interface MemoryConfig {
  maxInstances: number
  maxMemoryUsage: number // in MB
  cleanupInterval: number // in milliseconds
  inactiveThreshold: number // in milliseconds
  memoryPressureThreshold: number // in MB
}

/**
 * Memory manager for tour instances with automatic cleanup
 */
export class TourMemoryManager {
  private static instance: TourMemoryManager
  private tourInstances = new Map<string, TourInstance>()
  private cleanupTimer?: NodeJS.Timeout
  private memoryObserver?: PerformanceObserver
  private config: MemoryConfig

  private constructor(config?: Partial<MemoryConfig>) {
    this.config = {
      maxInstances: 20,
      maxMemoryUsage: 50, // 50MB
      cleanupInterval: 30000, // 30 seconds
      inactiveThreshold: 300000, // 5 minutes
      memoryPressureThreshold: 40, // 40MB
      ...config
    }

    this.initializeMemoryMonitoring()
    this.startCleanupTimer()
  }

  static getInstance(config?: Partial<MemoryConfig>): TourMemoryManager {
    if (!TourMemoryManager.instance) {
      TourMemoryManager.instance = new TourMemoryManager(config)
    }
    return TourMemoryManager.instance
  }

  /**
   * Register a tour instance for memory management
   */
  registerTour(tourId: string, tour: TourDefinition, cleanup?: () => void): void {
    const memoryUsage = this.estimateMemoryUsage(tour)
    
    const instance: TourInstance = {
      id: tourId,
      tour,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1,
      memoryUsage,
      isActive: true,
      cleanup
    }

    // Check if we need to free memory first
    this.ensureMemoryAvailable(memoryUsage)

    this.tourInstances.set(tourId, instance)
    
    console.log(`Registered tour ${tourId} (${memoryUsage.toFixed(2)}KB memory usage)`)
  }

  /**
   * Update tour access statistics
   */
  accessTour(tourId: string): void {
    const instance = this.tourInstances.get(tourId)
    if (instance) {
      instance.lastAccessed = new Date()
      instance.accessCount++
    }
  }

  /**
   * Mark tour as active/inactive
   */
  setTourActive(tourId: string, isActive: boolean): void {
    const instance = this.tourInstances.get(tourId)
    if (instance) {
      instance.isActive = isActive
      if (isActive) {
        instance.lastAccessed = new Date()
      }
    }
  }

  /**
   * Unregister a tour instance
   */
  unregisterTour(tourId: string): void {
    const instance = this.tourInstances.get(tourId)
    if (instance) {
      // Call cleanup function if provided
      if (instance.cleanup) {
        try {
          instance.cleanup()
        } catch (error) {
          console.warn(`Error during tour cleanup for ${tourId}:`, error)
        }
      }

      this.tourInstances.delete(tourId)
      console.log(`Unregistered tour ${tourId}`)
    }
  }

  /**
   * Force cleanup of inactive tours
   */
  cleanupInactiveTours(): number {
    const now = Date.now()
    const toCleanup: string[] = []

    for (const [tourId, instance] of this.tourInstances.entries()) {
      const inactiveTime = now - instance.lastAccessed.getTime()
      
      if (!instance.isActive && inactiveTime > this.config.inactiveThreshold) {
        toCleanup.push(tourId)
      }
    }

    toCleanup.forEach(tourId => this.unregisterTour(tourId))
    
    if (toCleanup.length > 0) {
      console.log(`Cleaned up ${toCleanup.length} inactive tours`)
    }

    return toCleanup.length
  }

  /**
   * Force cleanup based on memory pressure
   */
  cleanupByMemoryPressure(): number {
    const stats = this.getMemoryStats()
    
    if (stats.memoryPressure === 'low') {
      return 0
    }

    // Sort instances by priority (least recently used, inactive first)
    const instances = Array.from(this.tourInstances.entries())
      .sort(([, a], [, b]) => {
        // Inactive tours first
        if (a.isActive !== b.isActive) {
          return a.isActive ? 1 : -1
        }
        
        // Then by last accessed time (oldest first)
        return a.lastAccessed.getTime() - b.lastAccessed.getTime()
      })

    const toCleanup: string[] = []
    let memoryFreed = 0
    const targetMemory = this.config.memoryPressureThreshold * 0.8 // Target 80% of threshold

    for (const [tourId, instance] of instances) {
      if (stats.totalMemoryUsage - memoryFreed <= targetMemory) {
        break
      }

      toCleanup.push(tourId)
      memoryFreed += instance.memoryUsage
    }

    toCleanup.forEach(tourId => this.unregisterTour(tourId))
    
    if (toCleanup.length > 0) {
      console.log(`Cleaned up ${toCleanup.length} tours due to memory pressure (freed ${memoryFreed.toFixed(2)}KB)`)
    }

    return toCleanup.length
  }

  /**
   * Get comprehensive memory statistics
   */
  getMemoryStats(): MemoryStats {
    const instances = Array.from(this.tourInstances.values())
    const totalMemoryUsage = instances.reduce((sum, instance) => sum + instance.memoryUsage, 0) / 1024 // Convert to MB
    const activeInstances = instances.filter(instance => instance.isActive).length
    const oldestInstance = instances.length > 0 
      ? new Date(Math.min(...instances.map(i => i.createdAt.getTime())))
      : undefined

    let memoryPressure: 'low' | 'medium' | 'high' = 'low'
    if (totalMemoryUsage > this.config.memoryPressureThreshold) {
      memoryPressure = 'high'
    } else if (totalMemoryUsage > this.config.memoryPressureThreshold * 0.7) {
      memoryPressure = 'medium'
    }

    return {
      totalInstances: instances.length,
      activeInstances,
      totalMemoryUsage,
      averageMemoryPerTour: instances.length > 0 ? totalMemoryUsage / instances.length : 0,
      oldestInstance,
      memoryPressure
    }
  }

  /**
   * Get detailed information about tour instances
   */
  getTourInstances(): Array<{
    id: string
    memoryUsage: number
    isActive: boolean
    age: number
    accessCount: number
    lastAccessed: Date
  }> {
    const now = Date.now()
    
    return Array.from(this.tourInstances.values()).map(instance => ({
      id: instance.id,
      memoryUsage: instance.memoryUsage / 1024, // Convert to KB
      isActive: instance.isActive,
      age: now - instance.createdAt.getTime(),
      accessCount: instance.accessCount,
      lastAccessed: instance.lastAccessed
    }))
  }

  /**
   * Optimize memory usage based on current state
   */
  optimizeMemory(): {
    cleanedInactive: number
    cleanedByPressure: number
    memoryFreed: number
    recommendations: string[]
  } {
    const beforeStats = this.getMemoryStats()
    
    const cleanedInactive = this.cleanupInactiveTours()
    const cleanedByPressure = this.cleanupByMemoryPressure()
    
    const afterStats = this.getMemoryStats()
    const memoryFreed = beforeStats.totalMemoryUsage - afterStats.totalMemoryUsage

    const recommendations = this.generateMemoryRecommendations(afterStats)

    return {
      cleanedInactive,
      cleanedByPressure,
      memoryFreed,
      recommendations
    }
  }

  /**
   * Configure memory management settings
   */
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.stopCleanupTimer()
      this.startCleanupTimer()
    }
  }

  /**
   * Destroy the memory manager and cleanup all resources
   */
  destroy(): void {
    // Cleanup all tour instances
    const tourIds = Array.from(this.tourInstances.keys())
    tourIds.forEach(tourId => this.unregisterTour(tourId))

    // Stop timers and observers
    this.stopCleanupTimer()
    this.stopMemoryMonitoring()

    TourMemoryManager.instance = null as any
  }

  /**
   * Private helper methods
   */
  private estimateMemoryUsage(tour: TourDefinition): number {
    // Estimate memory usage based on tour complexity
    let size = 0
    
    // Base tour object
    size += JSON.stringify({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      category: tour.category,
      metadata: tour.metadata
    }).length

    // Steps (usually the largest part)
    size += tour.steps.reduce((stepSize, step) => {
      return stepSize + JSON.stringify({
        title: step.title,
        description: step.description,
        element: typeof step.element === 'string' ? step.element : '[HTMLElement]'
      }).length
    }, 0)

    // Triggers and conditions
    size += JSON.stringify(tour.triggers || []).length
    size += JSON.stringify(tour.conditions || []).length

    // Add overhead for DOM references and event listeners (estimated)
    size += tour.steps.length * 500 // 500 bytes per step for DOM overhead

    return size
  }

  private ensureMemoryAvailable(requiredMemory: number): void {
    const stats = this.getMemoryStats()
    const currentMemoryMB = stats.totalMemoryUsage
    const requiredMemoryMB = requiredMemory / (1024 * 1024)

    // Check if we exceed instance limit
    if (this.tourInstances.size >= this.config.maxInstances) {
      this.cleanupLeastRecentlyUsed(1)
    }

    // Check if we exceed memory limit
    if (currentMemoryMB + requiredMemoryMB > this.config.maxMemoryUsage) {
      const memoryToFree = (currentMemoryMB + requiredMemoryMB) - this.config.maxMemoryUsage
      this.freeMemory(memoryToFree)
    }
  }

  private cleanupLeastRecentlyUsed(count: number): void {
    const instances = Array.from(this.tourInstances.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
      .slice(0, count)

    instances.forEach(([tourId]) => this.unregisterTour(tourId))
  }

  private freeMemory(targetMemoryMB: number): void {
    const instances = Array.from(this.tourInstances.entries())
      .sort(([, a], [, b]) => {
        // Prioritize inactive tours
        if (a.isActive !== b.isActive) {
          return a.isActive ? 1 : -1
        }
        // Then by memory usage (largest first)
        return b.memoryUsage - a.memoryUsage
      })

    let freedMemoryMB = 0
    const toCleanup: string[] = []

    for (const [tourId, instance] of instances) {
      if (freedMemoryMB >= targetMemoryMB) break
      
      toCleanup.push(tourId)
      freedMemoryMB += instance.memoryUsage / (1024 * 1024)
    }

    toCleanup.forEach(tourId => this.unregisterTour(tourId))
  }

  private generateMemoryRecommendations(stats: MemoryStats): string[] {
    const recommendations: string[] = []

    if (stats.memoryPressure === 'high') {
      recommendations.push('Memory usage is high - consider reducing tour complexity or increasing cleanup frequency')
    }

    if (stats.totalInstances > this.config.maxInstances * 0.8) {
      recommendations.push('High number of tour instances - consider more aggressive cleanup')
    }

    if (stats.averageMemoryPerTour > 1) { // 1MB per tour
      recommendations.push('Tours are using significant memory - optimize tour content')
    }

    if (stats.activeInstances < stats.totalInstances * 0.5) {
      recommendations.push('Many inactive tours - consider reducing inactive threshold')
    }

    return recommendations
  }

  private initializeMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      this.memoryObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        for (const entry of entries) {
          if (entry.entryType === 'measure' && entry.name.startsWith('tour-')) {
            // Handle tour performance measurements
            console.debug(`Tour performance: ${entry.name} took ${entry.duration}ms`)
          }
        }
      })

      this.memoryObserver.observe({ entryTypes: ['measure'] })
    } catch (error) {
      console.warn('Failed to initialize memory monitoring:', error)
    }
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryObserver) {
      this.memoryObserver.disconnect()
      this.memoryObserver = undefined
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveTours()
      
      const stats = this.getMemoryStats()
      if (stats.memoryPressure !== 'low') {
        this.cleanupByMemoryPressure()
      }
    }, this.config.cleanupInterval)
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }
}

/**
 * Tour rendering optimizer for efficient DOM manipulation
 */
export class TourRenderingOptimizer {
  private static instance: TourRenderingOptimizer
  private renderCache = new Map<string, HTMLElement>()
  private intersectionObserver?: IntersectionObserver
  private resizeObserver?: ResizeObserver
  private activeElements = new Set<HTMLElement>()

  private constructor() {
    this.initializeObservers()
  }

  static getInstance(): TourRenderingOptimizer {
    if (!TourRenderingOptimizer.instance) {
      TourRenderingOptimizer.instance = new TourRenderingOptimizer()
    }
    return TourRenderingOptimizer.instance
  }

  /**
   * Optimize element selection and caching
   */
  optimizeElementSelection(selector: string, context?: Document | HTMLElement): HTMLElement | null {
    const cacheKey = `${selector}-${context ? 'context' : 'document'}`
    
    // Check cache first
    const cached = this.renderCache.get(cacheKey)
    if (cached && this.isElementValid(cached)) {
      return cached
    }

    // Find element
    const element = (context || document).querySelector(selector) as HTMLElement
    
    if (element) {
      // Cache the element
      this.renderCache.set(cacheKey, element)
      
      // Observe for changes
      this.observeElement(element)
    }

    return element
  }

  /**
   * Batch DOM operations for better performance
   */
  batchDOMOperations(operations: Array<() => void>): void {
    // Use requestAnimationFrame for optimal timing
    requestAnimationFrame(() => {
      // Batch all operations together
      operations.forEach(operation => {
        try {
          operation()
        } catch (error) {
          console.warn('DOM operation failed:', error)
        }
      })
    })
  }

  /**
   * Optimize tour step rendering
   */
  optimizeStepRendering(
    element: HTMLElement,
    stepContent: { title: string; description: string },
    position: string
  ): {
    optimizedPosition: string
    shouldDefer: boolean
    renderPriority: 'high' | 'medium' | 'low'
  } {
    const rect = element.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Optimize position based on element location
    let optimizedPosition = position
    if (position === 'auto') {
      optimizedPosition = this.calculateOptimalPosition(rect, viewport)
    }

    // Determine if rendering should be deferred
    const shouldDefer = !this.isElementInViewport(rect, viewport)

    // Calculate render priority
    const renderPriority = this.calculateRenderPriority(element, rect, viewport)

    return {
      optimizedPosition,
      shouldDefer,
      renderPriority
    }
  }

  /**
   * Preload tour assets for better performance
   */
  preloadTourAssets(tour: TourDefinition): Promise<void> {
    const preloadPromises: Promise<void>[] = []

    // Preload any images or assets referenced in tour steps
    tour.steps.forEach(step => {
      // Extract image URLs from descriptions
      const imageUrls = this.extractImageUrls(step.description)
      imageUrls.forEach(url => {
        preloadPromises.push(this.preloadImage(url))
      })
    })

    return Promise.all(preloadPromises).then(() => {})
  }

  /**
   * Clean up rendering resources
   */
  cleanup(): void {
    this.renderCache.clear()
    this.activeElements.clear()
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }

  /**
   * Private helper methods
   */
  private isElementValid(element: HTMLElement): boolean {
    return element.isConnected && document.contains(element)
  }

  private observeElement(element: HTMLElement): void {
    if (this.activeElements.has(element)) return

    this.activeElements.add(element)

    // Observe visibility changes
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element)
    }

    // Observe size changes
    if (this.resizeObserver) {
      this.resizeObserver.observe(element)
    }
  }

  private calculateOptimalPosition(
    elementRect: DOMRect,
    viewport: { width: number; height: number }
  ): string {
    const centerX = elementRect.left + elementRect.width / 2
    const centerY = elementRect.top + elementRect.height / 2

    // Determine best position based on available space
    const spaceTop = elementRect.top
    const spaceBottom = viewport.height - elementRect.bottom
    const spaceLeft = elementRect.left
    const spaceRight = viewport.width - elementRect.right

    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight)

    if (maxSpace === spaceBottom) return 'bottom'
    if (maxSpace === spaceTop) return 'top'
    if (maxSpace === spaceRight) return 'right'
    return 'left'
  }

  private isElementInViewport(
    elementRect: DOMRect,
    viewport: { width: number; height: number }
  ): boolean {
    return (
      elementRect.top >= 0 &&
      elementRect.left >= 0 &&
      elementRect.bottom <= viewport.height &&
      elementRect.right <= viewport.width
    )
  }

  private calculateRenderPriority(
    element: HTMLElement,
    rect: DOMRect,
    viewport: { width: number; height: number }
  ): 'high' | 'medium' | 'low' {
    // High priority for visible, interactive elements
    if (this.isElementInViewport(rect, viewport)) {
      const isInteractive = element.matches('button, input, select, textarea, a, [tabindex]')
      return isInteractive ? 'high' : 'medium'
    }

    return 'low'
  }

  private extractImageUrls(text: string): string[] {
    const imageRegex = /!\[.*?\]\((.*?)\)|<img[^>]+src="([^"]+)"/g
    const urls: string[] = []
    let match

    while ((match = imageRegex.exec(text)) !== null) {
      const url = match[1] || match[2]
      if (url) urls.push(url)
    }

    return urls
  }

  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`))
      img.src = url
    })
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    // Initialize intersection observer for visibility tracking
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            // Element is no longer visible, consider removing from cache
            const element = entry.target as HTMLElement
            this.handleElementVisibilityChange(element, false)
          }
        })
      })
    }

    // Initialize resize observer for layout changes
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          const element = entry.target as HTMLElement
          this.handleElementResize(element)
        })
      })
    }
  }

  private handleElementVisibilityChange(element: HTMLElement, isVisible: boolean): void {
    if (!isVisible) {
      // Remove from active elements if not visible for too long
      setTimeout(() => {
        if (!this.isElementInViewport(element.getBoundingClientRect(), {
          width: window.innerWidth,
          height: window.innerHeight
        })) {
          this.activeElements.delete(element)
        }
      }, 5000) // 5 second delay
    }
  }

  private handleElementResize(element: HTMLElement): void {
    // Invalidate cache entries for resized elements
    for (const [key, cachedElement] of this.renderCache.entries()) {
      if (cachedElement === element) {
        this.renderCache.delete(key)
      }
    }
  }
}

/**
 * Convenience functions
 */
export function getTourMemoryManager(config?: Partial<MemoryConfig>): TourMemoryManager {
  return TourMemoryManager.getInstance(config)
}

export function getTourRenderingOptimizer(): TourRenderingOptimizer {
  return TourRenderingOptimizer.getInstance()
}

export function optimizeTourMemory(): Promise<{
  cleanedInactive: number
  cleanedByPressure: number
  memoryFreed: number
  recommendations: string[]
}> {
  const manager = getTourMemoryManager()
  return Promise.resolve(manager.optimizeMemory())
}

export function getTourMemoryStats(): MemoryStats {
  const manager = getTourMemoryManager()
  return manager.getMemoryStats()
}