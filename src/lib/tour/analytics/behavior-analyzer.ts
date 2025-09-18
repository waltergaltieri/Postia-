/**
 * User Behavior Analyzer for Tours
 * 
 * Analyzes user behavior patterns during tours to optimize tour design
 * and identify areas for improvement.
 */

import { TourEvent, TourAnalytics } from '@/types/tour'

export interface BehaviorAnalysis {
  engagementMetrics: EngagementMetrics
  navigationPatterns: NavigationPatterns
  helpSeekingBehavior: HelpSeekingBehavior
  attentionMetrics: AttentionMetrics
  userSegments: UserSegment[]
}

export interface EngagementMetrics {
  averageTimePerStep: number
  interactionRate: number
  backtrackingFrequency: number
  pauseFrequency: number
  rushingIndicators: RushingIndicators
}

export interface NavigationPatterns {
  preferredNavigationMethod: 'click' | 'keyboard' | 'mixed'
  skipPatterns: Map<number, number>
  backtrackPatterns: Map<number, number>
  exitPoints: Map<number, number>
}

export interface HelpSeekingBehavior {
  helpRequestRate: number
  helpRequestsByStep: Map<number, number>
  helpRequestTiming: number[]
  commonHelpTopics: Map<string, number>
}

export interface AttentionMetrics {
  focusLossEvents: number
  tabSwitchEvents: number
  scrollBehavior: ScrollBehavior
  mouseMovementPatterns: MouseMovementPattern[]
}

export interface ScrollBehavior {
  averageScrollsPerStep: number
  scrollDirection: 'up' | 'down' | 'mixed'
  scrollSpeed: number
}

export interface MouseMovementPattern {
  stepIndex: number
  movementIntensity: number
  hoverDuration: number
  clickAccuracy: number
}

export interface RushingIndicators {
  fastClickRate: number
  skipWithoutReading: number
  belowAverageTimeSteps: number[]
}

export interface UserSegment {
  segmentName: string
  userCount: number
  characteristics: string[]
  completionRate: number
  averageTime: number
  commonBehaviors: string[]
}

export class BehaviorAnalyzer {
  /**
   * Analyze user behavior from tour analytics
   */
  static analyzeBehavior(analytics: TourAnalytics[]): BehaviorAnalysis {
    const engagementMetrics = this.analyzeEngagement(analytics)
    const navigationPatterns = this.analyzeNavigation(analytics)
    const helpSeekingBehavior = this.analyzeHelpSeeking(analytics)
    const attentionMetrics = this.analyzeAttention(analytics)
    const userSegments = this.segmentUsers(analytics)

    return {
      engagementMetrics,
      navigationPatterns,
      helpSeekingBehavior,
      attentionMetrics,
      userSegments
    }
  }

  /**
   * Analyze user engagement patterns
   */
  private static analyzeEngagement(analytics: TourAnalytics[]): EngagementMetrics {
    let totalStepTime = 0
    let totalSteps = 0
    let totalInteractions = 0
    let backtrackCount = 0
    let pauseCount = 0
    const stepTimes: number[] = []

    analytics.forEach(tourAnalytics => {
      const { events } = tourAnalytics
      let previousStepIndex = -1
      let stepStartTime = 0

      events.forEach(event => {
        switch (event.type) {
          case 'step_viewed':
            if (event.stepIndex !== undefined) {
              stepStartTime = event.timestamp.getTime()
              
              // Check for backtracking
              if (event.stepIndex < previousStepIndex) {
                backtrackCount++
              }
              previousStepIndex = event.stepIndex
            }
            break

          case 'step_completed':
            if (event.stepIndex !== undefined && stepStartTime > 0) {
              const stepTime = event.timestamp.getTime() - stepStartTime
              stepTimes.push(stepTime)
              totalStepTime += stepTime
              totalSteps++
            }
            totalInteractions++
            break

          case 'help_requested':
            totalInteractions++
            break
        }
      })
    })

    // Calculate rushing indicators
    const averageStepTime = totalSteps > 0 ? totalStepTime / totalSteps : 0
    const fastSteps = stepTimes.filter(time => time < averageStepTime * 0.5).length
    const fastClickRate = totalSteps > 0 ? (fastSteps / totalSteps) * 100 : 0

    const belowAverageTimeSteps = stepTimes
      .map((time, index) => ({ time, index }))
      .filter(({ time }) => time < averageStepTime * 0.7)
      .map(({ index }) => index)

    return {
      averageTimePerStep: averageStepTime,
      interactionRate: totalSteps > 0 ? (totalInteractions / totalSteps) * 100 : 0,
      backtrackingFrequency: totalSteps > 0 ? (backtrackCount / totalSteps) * 100 : 0,
      pauseFrequency: pauseCount, // Would need pause detection logic
      rushingIndicators: {
        fastClickRate,
        skipWithoutReading: 0, // Would need reading time analysis
        belowAverageTimeSteps
      }
    }
  }

  /**
   * Analyze navigation patterns
   */
  private static analyzeNavigation(analytics: TourAnalytics[]): NavigationPatterns {
    const skipPatterns = new Map<number, number>()
    const backtrackPatterns = new Map<number, number>()
    const exitPoints = new Map<number, number>()
    let keyboardNavCount = 0
    let clickNavCount = 0

    analytics.forEach(tourAnalytics => {
      const { events } = tourAnalytics
      let previousStepIndex = -1

      events.forEach(event => {
        // Track navigation method (would need more detailed event data)
        if (event.metadata?.navigationMethod === 'keyboard') {
          keyboardNavCount++
        } else if (event.metadata?.navigationMethod === 'click') {
          clickNavCount++
        }

        switch (event.type) {
          case 'step_viewed':
            if (event.stepIndex !== undefined) {
              // Check for backtracking
              if (event.stepIndex < previousStepIndex) {
                const count = backtrackPatterns.get(event.stepIndex) || 0
                backtrackPatterns.set(event.stepIndex, count + 1)
              }
              previousStepIndex = event.stepIndex
            }
            break

          case 'tour_skipped':
            if (event.stepIndex !== undefined) {
              const count = skipPatterns.get(event.stepIndex) || 0
              skipPatterns.set(event.stepIndex, count + 1)
              
              const exitCount = exitPoints.get(event.stepIndex) || 0
              exitPoints.set(event.stepIndex, exitCount + 1)
            }
            break
        }
      })
    })

    // Determine preferred navigation method
    const totalNav = keyboardNavCount + clickNavCount
    let preferredNavigationMethod: 'click' | 'keyboard' | 'mixed' = 'mixed'
    
    if (totalNav > 0) {
      const keyboardRatio = keyboardNavCount / totalNav
      if (keyboardRatio > 0.7) {
        preferredNavigationMethod = 'keyboard'
      } else if (keyboardRatio < 0.3) {
        preferredNavigationMethod = 'click'
      }
    }

    return {
      preferredNavigationMethod,
      skipPatterns,
      backtrackPatterns,
      exitPoints
    }
  }

  /**
   * Analyze help-seeking behavior
   */
  private static analyzeHelpSeeking(analytics: TourAnalytics[]): HelpSeekingBehavior {
    const helpRequestsByStep = new Map<number, number>()
    const helpRequestTiming: number[] = []
    const commonHelpTopics = new Map<string, number>()
    let totalHelpRequests = 0
    let totalSteps = 0

    analytics.forEach(tourAnalytics => {
      const { events } = tourAnalytics
      let tourStartTime = 0

      events.forEach(event => {
        if (event.type === 'tour_started') {
          tourStartTime = event.timestamp.getTime()
        } else if (event.type === 'step_viewed') {
          totalSteps++
        } else if (event.type === 'help_requested') {
          totalHelpRequests++
          
          if (event.stepIndex !== undefined) {
            const count = helpRequestsByStep.get(event.stepIndex) || 0
            helpRequestsByStep.set(event.stepIndex, count + 1)
          }

          if (tourStartTime > 0) {
            const timingFromStart = event.timestamp.getTime() - tourStartTime
            helpRequestTiming.push(timingFromStart)
          }

          const helpType = event.metadata?.helpType
          if (helpType) {
            const count = commonHelpTopics.get(helpType) || 0
            commonHelpTopics.set(helpType, count + 1)
          }
        }
      })
    })

    const helpRequestRate = totalSteps > 0 ? (totalHelpRequests / totalSteps) * 100 : 0

    return {
      helpRequestRate,
      helpRequestsByStep,
      helpRequestTiming,
      commonHelpTopics
    }
  }

  /**
   * Analyze attention and focus metrics
   */
  private static analyzeAttention(analytics: TourAnalytics[]): AttentionMetrics {
    let focusLossEvents = 0
    let tabSwitchEvents = 0
    const mouseMovementPatterns: MouseMovementPattern[] = []

    analytics.forEach(tourAnalytics => {
      const { events } = tourAnalytics

      events.forEach(event => {
        // Track focus loss events
        if (event.metadata?.eventType === 'focus_loss') {
          focusLossEvents++
        }

        // Track tab switch events
        if (event.metadata?.eventType === 'tab_switch') {
          tabSwitchEvents++
        }

        // Track mouse movement patterns (would need detailed mouse tracking)
        if (event.metadata?.mouseMovement && event.stepIndex !== undefined) {
          mouseMovementPatterns.push({
            stepIndex: event.stepIndex,
            movementIntensity: event.metadata.mouseMovement.intensity || 0,
            hoverDuration: event.metadata.mouseMovement.hoverDuration || 0,
            clickAccuracy: event.metadata.mouseMovement.clickAccuracy || 100
          })
        }
      })
    })

    return {
      focusLossEvents,
      tabSwitchEvents,
      scrollBehavior: {
        averageScrollsPerStep: 0, // Would need scroll tracking
        scrollDirection: 'mixed',
        scrollSpeed: 0
      },
      mouseMovementPatterns
    }
  }

  /**
   * Segment users based on behavior patterns
   */
  private static segmentUsers(analytics: TourAnalytics[]): UserSegment[] {
    const segments: UserSegment[] = []
    
    // Analyze user patterns
    const userPatterns = new Map<string, {
      completionRate: number
      averageTime: number
      helpRequests: number
      backtracking: number
      rushing: boolean
    }>()

    analytics.forEach(tourAnalytics => {
      const { userId, events } = tourAnalytics
      
      const isCompleted = events.some(e => e.type === 'tour_completed')
      const helpRequests = events.filter(e => e.type === 'help_requested').length
      const totalTime = events.length > 0 ? 
        events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime() : 0
      
      // Calculate backtracking
      let backtracking = 0
      let previousStep = -1
      events.forEach(event => {
        if (event.type === 'step_viewed' && event.stepIndex !== undefined) {
          if (event.stepIndex < previousStep) {
            backtracking++
          }
          previousStep = event.stepIndex
        }
      })

      // Detect rushing (completing steps very quickly)
      const stepTimes = this.calculateStepTimes(events)
      const averageStepTime = stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
      const rushing = stepTimes.filter(time => time < 2000).length > stepTimes.length * 0.5 // Less than 2 seconds per step

      userPatterns.set(userId, {
        completionRate: isCompleted ? 100 : 0,
        averageTime: totalTime,
        helpRequests,
        backtracking,
        rushing
      })
    })

    // Create segments based on patterns
    const completers = Array.from(userPatterns.entries()).filter(([_, pattern]) => pattern.completionRate > 0)
    const helpSeekers = Array.from(userPatterns.entries()).filter(([_, pattern]) => pattern.helpRequests > 2)
    const explorers = Array.from(userPatterns.entries()).filter(([_, pattern]) => pattern.backtracking > 3)
    const rushers = Array.from(userPatterns.entries()).filter(([_, pattern]) => pattern.rushing)

    // Build segment objects
    if (completers.length > 0) {
      segments.push({
        segmentName: 'Successful Completers',
        userCount: completers.length,
        characteristics: ['High completion rate', 'Moderate help usage', 'Steady progression'],
        completionRate: 100,
        averageTime: completers.reduce((sum, [_, p]) => sum + p.averageTime, 0) / completers.length,
        commonBehaviors: ['Follows tour flow', 'Reads instructions', 'Completes successfully']
      })
    }

    if (helpSeekers.length > 0) {
      segments.push({
        segmentName: 'Help Seekers',
        userCount: helpSeekers.length,
        characteristics: ['High help request rate', 'Thorough approach', 'Detail-oriented'],
        completionRate: helpSeekers.filter(([_, p]) => p.completionRate > 0).length / helpSeekers.length * 100,
        averageTime: helpSeekers.reduce((sum, [_, p]) => sum + p.averageTime, 0) / helpSeekers.length,
        commonBehaviors: ['Requests help frequently', 'Takes time to understand', 'Careful progression']
      })
    }

    if (explorers.length > 0) {
      segments.push({
        segmentName: 'Explorers',
        userCount: explorers.length,
        characteristics: ['High backtracking', 'Non-linear navigation', 'Curious behavior'],
        completionRate: explorers.filter(([_, p]) => p.completionRate > 0).length / explorers.length * 100,
        averageTime: explorers.reduce((sum, [_, p]) => sum + p.averageTime, 0) / explorers.length,
        commonBehaviors: ['Goes back to previous steps', 'Explores different paths', 'Non-sequential learning']
      })
    }

    if (rushers.length > 0) {
      segments.push({
        segmentName: 'Rushers',
        userCount: rushers.length,
        characteristics: ['Fast progression', 'Low engagement time', 'Task-focused'],
        completionRate: rushers.filter(([_, p]) => p.completionRate > 0).length / rushers.length * 100,
        averageTime: rushers.reduce((sum, [_, p]) => sum + p.averageTime, 0) / rushers.length,
        commonBehaviors: ['Skips through quickly', 'Minimal reading time', 'Goal-oriented']
      })
    }

    return segments
  }

  /**
   * Calculate time spent on each step
   */
  private static calculateStepTimes(events: TourEvent[]): number[] {
    const stepTimes: number[] = []
    let stepStartTime = 0

    events.forEach(event => {
      if (event.type === 'step_viewed') {
        stepStartTime = event.timestamp.getTime()
      } else if (event.type === 'step_completed' && stepStartTime > 0) {
        const stepTime = event.timestamp.getTime() - stepStartTime
        stepTimes.push(stepTime)
        stepStartTime = 0
      }
    })

    return stepTimes
  }

  /**
   * Generate behavior-based recommendations
   */
  static generateBehaviorRecommendations(analysis: BehaviorAnalysis): string[] {
    const recommendations: string[] = []

    // High help-seeking behavior
    if (analysis.helpSeekingBehavior.helpRequestRate > 30) {
      recommendations.push('Users frequently request help. Consider adding more contextual guidance and clearer instructions.')
    }

    // High backtracking
    if (analysis.engagementMetrics.backtrackingFrequency > 20) {
      recommendations.push('Users often go back to previous steps. Improve step clarity and add progress indicators.')
    }

    // Rushing behavior
    if (analysis.engagementMetrics.rushingIndicators.fastClickRate > 40) {
      recommendations.push('Users are rushing through tours. Consider adding engagement elements or breaking into shorter segments.')
    }

    // Attention issues
    if (analysis.attentionMetrics.focusLossEvents > 10) {
      recommendations.push('Users are losing focus during tours. Shorten tour length or add interactive elements.')
    }

    // Navigation preferences
    if (analysis.navigationPatterns.preferredNavigationMethod === 'keyboard') {
      recommendations.push('Users prefer keyboard navigation. Ensure all tour controls are keyboard accessible.')
    }

    // Segment-specific recommendations
    analysis.userSegments.forEach(segment => {
      if (segment.segmentName === 'Help Seekers' && segment.userCount > 20) {
        recommendations.push('Large segment of help seekers detected. Consider adding progressive disclosure and contextual help.')
      }
      
      if (segment.segmentName === 'Rushers' && segment.completionRate < 50) {
        recommendations.push('Rushers have low completion rates. Add checkpoints and engagement validation.')
      }
    })

    return recommendations
  }
}