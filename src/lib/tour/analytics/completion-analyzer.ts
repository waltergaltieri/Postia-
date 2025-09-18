/**
 * Tour Completion Rate Analyzer
 * 
 * Provides detailed analysis of tour completion rates and drop-off patterns
 */

import { TourEvent, TourAnalytics } from '@/types/tour'
import { TourMetrics, StepMetrics } from '../tour-analytics'

export interface CompletionAnalysis {
  overallCompletionRate: number
  completionByTour: Map<string, number>
  completionByUserRole: Map<string, number>
  completionByDevice: Map<string, number>
  dropoffAnalysis: DropoffAnalysis
  timeToComplete: TimeAnalysis
  retryAnalysis: RetryAnalysis
}

export interface DropoffAnalysis {
  mostCommonDropoffStep: number
  dropoffReasons: Map<string, number>
  dropoffByStep: Map<number, number>
  criticalDropoffPoints: number[]
}

export interface TimeAnalysis {
  averageCompletionTime: number
  medianCompletionTime: number
  completionTimeByStep: number[]
  fastestCompletion: number
  slowestCompletion: number
}

export interface RetryAnalysis {
  usersWhoRetried: number
  averageRetryCount: number
  retrySuccessRate: number
  mostRetriedSteps: number[]
}

export class CompletionAnalyzer {
  /**
   * Analyze completion rates from analytics data
   */
  static analyzeCompletion(analytics: TourAnalytics[]): CompletionAnalysis {
    const completionByTour = new Map<string, number>()
    const completionByUserRole = new Map<string, number>()
    const completionByDevice = new Map<string, number>()
    const completionTimes: number[] = []
    const dropoffData: Array<{ step: number; reason?: string }> = []
    const retryData = new Map<string, number>()

    let totalTours = 0
    let completedTours = 0

    analytics.forEach(tourAnalytics => {
      const { tourId, events } = tourAnalytics
      totalTours++

      const isCompleted = events.some(e => e.type === 'tour_completed')
      if (isCompleted) {
        completedTours++
        
        // Track completion by tour
        const currentCount = completionByTour.get(tourId) || 0
        completionByTour.set(tourId, currentCount + 1)

        // Track completion time
        const completionEvent = events.find(e => e.type === 'tour_completed')
        if (completionEvent?.metadata?.totalDuration) {
          completionTimes.push(completionEvent.metadata.totalDuration)
        }
      }

      // Track dropoffs
      const skipEvent = events.find(e => e.type === 'tour_skipped')
      if (skipEvent && skipEvent.stepIndex !== undefined) {
        dropoffData.push({
          step: skipEvent.stepIndex,
          reason: skipEvent.metadata?.reason
        })
      }

      // Track user role completion
      const userRole = events[0]?.metadata?.userRole
      if (userRole) {
        const roleKey = `${userRole}_${isCompleted ? 'completed' : 'dropped'}`
        const currentCount = completionByUserRole.get(roleKey) || 0
        completionByUserRole.set(roleKey, currentCount + 1)
      }

      // Track device completion
      const device = this.detectDevice(events[0]?.metadata?.userAgent)
      if (device) {
        const deviceKey = `${device}_${isCompleted ? 'completed' : 'dropped'}`
        const currentCount = completionByDevice.get(deviceKey) || 0
        completionByDevice.set(deviceKey, currentCount + 1)
      }

      // Track retries
      const userId = tourAnalytics.userId
      const retryCount = retryData.get(userId) || 0
      retryData.set(userId, retryCount + 1)
    })

    return {
      overallCompletionRate: totalTours > 0 ? (completedTours / totalTours) * 100 : 0,
      completionByTour: this.calculateCompletionRates(completionByTour),
      completionByUserRole: this.calculateRoleCompletionRates(completionByUserRole),
      completionByDevice: this.calculateDeviceCompletionRates(completionByDevice),
      dropoffAnalysis: this.analyzeDropoffs(dropoffData),
      timeToComplete: this.analyzeCompletionTimes(completionTimes),
      retryAnalysis: this.analyzeRetries(retryData, analytics)
    }
  }

  /**
   * Analyze drop-off patterns
   */
  private static analyzeDropoffs(dropoffData: Array<{ step: number; reason?: string }>): DropoffAnalysis {
    const dropoffByStep = new Map<number, number>()
    const dropoffReasons = new Map<string, number>()

    dropoffData.forEach(({ step, reason }) => {
      // Count dropoffs by step
      const stepCount = dropoffByStep.get(step) || 0
      dropoffByStep.set(step, stepCount + 1)

      // Count dropoff reasons
      if (reason) {
        const reasonCount = dropoffReasons.get(reason) || 0
        dropoffReasons.set(reason, reasonCount + 1)
      }
    })

    // Find most common dropoff step
    let mostCommonDropoffStep = 0
    let maxDropoffs = 0
    dropoffByStep.forEach((count, step) => {
      if (count > maxDropoffs) {
        maxDropoffs = count
        mostCommonDropoffStep = step
      }
    })

    // Identify critical dropoff points (steps with >20% dropoff rate)
    const totalDropoffs = dropoffData.length
    const criticalDropoffPoints: number[] = []
    dropoffByStep.forEach((count, step) => {
      const dropoffRate = (count / totalDropoffs) * 100
      if (dropoffRate > 20) {
        criticalDropoffPoints.push(step)
      }
    })

    return {
      mostCommonDropoffStep,
      dropoffReasons,
      dropoffByStep,
      criticalDropoffPoints
    }
  }

  /**
   * Analyze completion times
   */
  private static analyzeCompletionTimes(completionTimes: number[]): TimeAnalysis {
    if (completionTimes.length === 0) {
      return {
        averageCompletionTime: 0,
        medianCompletionTime: 0,
        completionTimeByStep: [],
        fastestCompletion: 0,
        slowestCompletion: 0
      }
    }

    const sorted = [...completionTimes].sort((a, b) => a - b)
    const average = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    const median = sorted[Math.floor(sorted.length / 2)]

    return {
      averageCompletionTime: average,
      medianCompletionTime: median,
      completionTimeByStep: [], // Would need step-level timing data
      fastestCompletion: sorted[0],
      slowestCompletion: sorted[sorted.length - 1]
    }
  }

  /**
   * Analyze retry patterns
   */
  private static analyzeRetries(retryData: Map<string, number>, analytics: TourAnalytics[]): RetryAnalysis {
    const usersWhoRetried = Array.from(retryData.values()).filter(count => count > 1).length
    const totalRetries = Array.from(retryData.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0)
    const averageRetryCount = usersWhoRetried > 0 ? totalRetries / usersWhoRetried : 0

    // Calculate retry success rate
    const retriedUsers = Array.from(retryData.entries()).filter(([_, count]) => count > 1)
    const successfulRetries = retriedUsers.filter(([userId, _]) => {
      return analytics.some(a => a.userId === userId && a.events.some(e => e.type === 'tour_completed'))
    }).length

    const retrySuccessRate = retriedUsers.length > 0 ? (successfulRetries / retriedUsers.length) * 100 : 0

    // Find most retried steps (would need more detailed step retry tracking)
    const mostRetriedSteps: number[] = []

    return {
      usersWhoRetried,
      averageRetryCount,
      retrySuccessRate,
      mostRetriedSteps
    }
  }

  /**
   * Calculate completion rates for tours
   */
  private static calculateCompletionRates(completionByTour: Map<string, number>): Map<string, number> {
    const rates = new Map<string, number>()
    
    // This would need total attempts per tour to calculate accurate rates
    // For now, return the completion counts
    completionByTour.forEach((count, tourId) => {
      rates.set(tourId, count) // Would be: (count / totalAttempts) * 100
    })

    return rates
  }

  /**
   * Calculate completion rates by user role
   */
  private static calculateRoleCompletionRates(completionByUserRole: Map<string, number>): Map<string, number> {
    const rates = new Map<string, number>()
    const roleStats = new Map<string, { completed: number; total: number }>()

    // Group by role
    completionByUserRole.forEach((count, key) => {
      const [role, status] = key.split('_')
      if (!roleStats.has(role)) {
        roleStats.set(role, { completed: 0, total: 0 })
      }
      
      const stats = roleStats.get(role)!
      stats.total += count
      if (status === 'completed') {
        stats.completed += count
      }
    })

    // Calculate rates
    roleStats.forEach((stats, role) => {
      const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      rates.set(role, rate)
    })

    return rates
  }

  /**
   * Calculate completion rates by device
   */
  private static calculateDeviceCompletionRates(completionByDevice: Map<string, number>): Map<string, number> {
    const rates = new Map<string, number>()
    const deviceStats = new Map<string, { completed: number; total: number }>()

    // Group by device
    completionByDevice.forEach((count, key) => {
      const [device, status] = key.split('_')
      if (!deviceStats.has(device)) {
        deviceStats.set(device, { completed: 0, total: 0 })
      }
      
      const stats = deviceStats.get(device)!
      stats.total += count
      if (status === 'completed') {
        stats.completed += count
      }
    })

    // Calculate rates
    deviceStats.forEach((stats, device) => {
      const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      rates.set(device, rate)
    })

    return rates
  }

  /**
   * Detect device type from user agent
   */
  private static detectDevice(userAgent?: string): string {
    if (!userAgent) return 'unknown'
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile'
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  /**
   * Generate completion improvement recommendations
   */
  static generateRecommendations(analysis: CompletionAnalysis): string[] {
    const recommendations: string[] = []

    // Low completion rate recommendations
    if (analysis.overallCompletionRate < 50) {
      recommendations.push('Overall completion rate is low. Consider shortening tours or improving onboarding flow.')
    }

    // Critical dropoff points
    if (analysis.dropoffAnalysis.criticalDropoffPoints.length > 0) {
      recommendations.push(`Critical dropoff at steps: ${analysis.dropoffAnalysis.criticalDropoffPoints.join(', ')}. Review these steps for clarity and usability.`)
    }

    // Long completion times
    if (analysis.timeToComplete.averageCompletionTime > 300000) { // 5 minutes
      recommendations.push('Tours are taking too long to complete. Consider breaking them into shorter segments.')
    }

    // High retry rates
    if (analysis.retryAnalysis.averageRetryCount > 2) {
      recommendations.push('Users are retrying tours frequently. Improve tour clarity and error handling.')
    }

    // Device-specific issues
    analysis.completionByDevice.forEach((rate, device) => {
      if (rate < 30) {
        recommendations.push(`Low completion rate on ${device} devices. Optimize tour experience for this platform.`)
      }
    })

    return recommendations
  }
}