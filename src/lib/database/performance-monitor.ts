/**
 * Database performance monitoring and optimization utilities
 */

import { CacheUtils } from '../cache/client-cache'

interface QueryMetrics {
  queryType: string
  duration: number
  timestamp: number
  cacheHit: boolean
  clientId?: string
  userId?: string
}

interface PerformanceStats {
  totalQueries: number
  averageQueryTime: number
  cacheHitRate: number
  slowQueries: QueryMetrics[]
  queryTypeBreakdown: Record<string, {
    count: number
    averageTime: number
    cacheHitRate: number
  }>
}

class DatabasePerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 queries
  private slowQueryThreshold = 100 // 100ms

  /**
   * Record a query execution
   */
  recordQuery(
    queryType: string,
    duration: number,
    cacheHit: boolean = false,
    clientId?: string,
    userId?: string
  ): void {
    const metric: QueryMetrics = {
      queryType,
      duration,
      timestamp: Date.now(),
      cacheHit,
      clientId,
      userId
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold && !cacheHit) {
      console.warn(`Slow query detected: ${queryType} took ${duration}ms`, {
        clientId,
        userId,
        timestamp: new Date(metric.timestamp).toISOString()
      })
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): PerformanceStats {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoff)

    if (relevantMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        queryTypeBreakdown: {}
      }
    }

    const totalQueries = relevantMetrics.length
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    const cacheHits = relevantMetrics.filter(m => m.cacheHit).length
    const slowQueries = relevantMetrics.filter(m => m.duration > this.slowQueryThreshold)

    // Query type breakdown
    const queryTypeBreakdown: Record<string, {
      count: number
      averageTime: number
      cacheHitRate: number
    }> = {}

    relevantMetrics.forEach(metric => {
      if (!queryTypeBreakdown[metric.queryType]) {
        queryTypeBreakdown[metric.queryType] = {
          count: 0,
          averageTime: 0,
          cacheHitRate: 0
        }
      }

      const breakdown = queryTypeBreakdown[metric.queryType]
      breakdown.count++
    })

    // Calculate averages for each query type
    Object.keys(queryTypeBreakdown).forEach(queryType => {
      const typeMetrics = relevantMetrics.filter(m => m.queryType === queryType)
      const breakdown = queryTypeBreakdown[queryType]
      
      breakdown.averageTime = typeMetrics.reduce((sum, m) => sum + m.duration, 0) / typeMetrics.length
      breakdown.cacheHitRate = typeMetrics.filter(m => m.cacheHit).length / typeMetrics.length
    })

    return {
      totalQueries,
      averageQueryTime: totalTime / totalQueries,
      cacheHitRate: cacheHits / totalQueries,
      slowQueries: slowQueries.slice(-10), // Last 10 slow queries
      queryTypeBreakdown
    }
  }

  /**
   * Get client-specific performance stats
   */
  getClientStats(clientId: string, timeWindow?: number): PerformanceStats {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const clientMetrics = this.metrics.filter(m => 
      m.clientId === clientId && m.timestamp > cutoff
    )

    if (clientMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        cacheHitRate: 0,
        slowQueries: [],
        queryTypeBreakdown: {}
      }
    }

    // Use the same logic as getStats but with filtered metrics
    const totalQueries = clientMetrics.length
    const totalTime = clientMetrics.reduce((sum, m) => sum + m.duration, 0)
    const cacheHits = clientMetrics.filter(m => m.cacheHit).length
    const slowQueries = clientMetrics.filter(m => m.duration > this.slowQueryThreshold)

    return {
      totalQueries,
      averageQueryTime: totalTime / totalQueries,
      cacheHitRate: cacheHits / totalQueries,
      slowQueries: slowQueries.slice(-5),
      queryTypeBreakdown: {}
    }
  }

  /**
   * Clear old metrics
   */
  cleanup(olderThan: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(timeWindow?: number): QueryMetrics[] {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    return this.metrics.filter(m => m.timestamp > cutoff)
  }

  /**
   * Get recommendations based on performance data
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getStats(60 * 60 * 1000) // Last hour
    const recommendations: string[] = []

    if (stats.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low (<50%). Consider increasing cache TTL or improving cache key strategies.')
    }

    if (stats.averageQueryTime > 50) {
      recommendations.push('Average query time is high (>50ms). Consider adding database indexes or optimizing queries.')
    }

    if (stats.slowQueries.length > stats.totalQueries * 0.1) {
      recommendations.push('High number of slow queries detected. Review query patterns and consider optimization.')
    }

    // Check for specific query types that might need optimization
    Object.entries(stats.queryTypeBreakdown).forEach(([queryType, breakdown]) => {
      if (breakdown.averageTime > 100 && breakdown.cacheHitRate < 0.3) {
        recommendations.push(`Query type "${queryType}" has high latency and low cache hit rate. Consider optimization.`)
      }
    })

    return recommendations
  }
}

// Singleton instance
export const performanceMonitor = new DatabasePerformanceMonitor()

// Utility function to wrap database operations with monitoring
export function withPerformanceMonitoring<T>(
  queryType: string,
  operation: () => Promise<T>,
  clientId?: string,
  userId?: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now()
    let cacheHit = false

    try {
      const result = await operation()
      const duration = Date.now() - start
      
      // Check if this was likely a cache hit (very fast response)
      cacheHit = duration < 5

      performanceMonitor.recordQuery(queryType, duration, cacheHit, clientId, userId)
      resolve(result)
    } catch (error) {
      const duration = Date.now() - start
      performanceMonitor.recordQuery(queryType, duration, false, clientId, userId)
      reject(error)
    }
  })
}

// Performance monitoring middleware for API routes
export function createPerformanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now()
    const originalSend = res.send

    res.send = function(data: any) {
      const duration = Date.now() - start
      const queryType = `API:${req.method}:${req.route?.path || req.path}`
      
      performanceMonitor.recordQuery(
        queryType,
        duration,
        false,
        req.headers['x-client-id'],
        req.user?.id
      )

      return originalSend.call(this, data)
    }

    next()
  }
}

// Cleanup job - run periodically
setInterval(() => {
  performanceMonitor.cleanup()
}, 60 * 60 * 1000) // Every hour

// Export performance stats for monitoring dashboard
export function getPerformanceDashboardData() {
  const hourlyStats = performanceMonitor.getStats(60 * 60 * 1000)
  const dailyStats = performanceMonitor.getStats(24 * 60 * 60 * 1000)
  const cacheStats = CacheUtils.getAllStats()
  const recommendations = performanceMonitor.getOptimizationRecommendations()

  return {
    hourly: hourlyStats,
    daily: dailyStats,
    cache: cacheStats,
    recommendations
  }
}