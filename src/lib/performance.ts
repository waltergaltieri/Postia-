"use client"

// Performance monitoring utilities for image loading and UI rendering

interface PerformanceMetrics {
  renderTime: number
  imageLoadTime: number
  totalImages: number
  loadedImages: number
  failedImages: number
  memoryUsage?: number
  fps?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    imageLoadTime: 0,
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0
  }

  private observers: Map<string, PerformanceObserver> = new Map()
  private imageLoadTimes: Map<string, number> = new Map()

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // Observe paint timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              console.log(`First Contentful Paint: ${entry.startTime.toFixed(2)}ms`)
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.set('paint', paintObserver)
      } catch (error) {
        console.warn('Paint observer not supported:', error)
      }

      // Observe layout shifts
      try {
        const layoutObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.hadRecentInput) return // Ignore user-initiated shifts
            console.log(`Layout Shift Score: ${entry.value.toFixed(4)}`)
          })
        })
        layoutObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('layout', layoutObserver)
      } catch (error) {
        console.warn('Layout shift observer not supported:', error)
      }
    }
  }

  // Measure component render time
  measureRenderTime<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now()
    const result = renderFn()
    const endTime = performance.now()
    
    this.metrics.renderTime = endTime - startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${this.metrics.renderTime.toFixed(2)}ms`)
    }
    
    return result
  }

  // Track image loading performance
  trackImageLoad(src: string): {
    onLoad: () => void
    onError: () => void
  } {
    const startTime = performance.now()
    this.metrics.totalImages++
    this.imageLoadTimes.set(src, startTime)

    return {
      onLoad: () => {
        const loadTime = performance.now() - startTime
        this.metrics.loadedImages++
        this.metrics.imageLoadTime += loadTime
        this.imageLoadTimes.delete(src)
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Image loaded: ${src} (${loadTime.toFixed(2)}ms)`)
        }
      },
      onError: () => {
        this.metrics.failedImages++
        this.imageLoadTimes.delete(src)
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Image failed to load: ${src}`)
        }
      }
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Get average image load time
  getAverageImageLoadTime(): number {
    return this.metrics.loadedImages > 0 
      ? this.metrics.imageLoadTime / this.metrics.loadedImages 
      : 0
  }

  // Reset metrics
  reset() {
    this.metrics = {
      renderTime: 0,
      imageLoadTime: 0,
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0
    }
    this.imageLoadTimes.clear()
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>(() => 
    performanceMonitor.getMetrics()
  )

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const measureRender = React.useCallback(<T>(renderFn: () => T): T => {
    return performanceMonitor.measureRenderTime(componentName, renderFn)
  }, [componentName])

  return {
    metrics,
    measureRender,
    trackImageLoad: performanceMonitor.trackImageLoad.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor)
  }
}

// Utility functions for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memory usage monitoring
export function getMemoryUsage(): number | null {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory
    return memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
  }
  return null
}

// FPS monitoring
export function measureFPS(callback: (fps: number) => void): () => void {
  let frames = 0
  let lastTime = performance.now()
  let animationId: number

  function tick() {
    frames++
    const currentTime = performance.now()
    
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime))
      callback(fps)
      frames = 0
      lastTime = currentTime
    }
    
    animationId = requestAnimationFrame(tick)
  }

  animationId = requestAnimationFrame(tick)
  
  return () => cancelAnimationFrame(animationId)
}

// Image optimization utilities
export function getOptimalImageSize(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  const width = Math.ceil(containerWidth * devicePixelRatio)
  const height = Math.ceil(containerHeight * devicePixelRatio)
  
  // Round to nearest device size for better caching
  const deviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  const optimalWidth = deviceSizes.find(size => size >= width) || width
  
  return {
    width: optimalWidth,
    height: Math.ceil((height * optimalWidth) / width)
  }
}

// Preload critical images
export function preloadCriticalImages(imageSrcs: string[]): Promise<void[]> {
  const preloadPromises = imageSrcs.map((src) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
      img.src = src
    })
  })

  return Promise.allSettled(preloadPromises).then(() => [])
}

// React import for hooks
import * as React from "react"