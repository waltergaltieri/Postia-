/**
 * Testing Report Generator
 * Generates comprehensive usability testing reports with recommendations
 */

import { UserTestingSession, UserFeedback, UsabilityMetrics } from './usability-testing'

export interface TestingReport {
  id: string
  generatedAt: Date
  reportType: 'comprehensive' | 'executive' | 'technical'
  timeRange: {
    start: Date
    end: Date
  }
  summary: ReportSummary
  sessions: SessionAnalysis[]
  feedback: FeedbackAnalysis
  recommendations: Recommendation[]
  actionItems: ActionItem[]
  appendices: ReportAppendix[]
}

export interface ReportSummary {
  totalSessions: number
  totalParticipants: number
  averageSessionDuration: number
  overallMetrics: UsabilityMetrics
  keyFindings: string[]
  criticalIssues: number
  improvementAreas: string[]
}

export interface SessionAnalysis {
  sessionId: string
  participantId: string
  scenario: string
  duration: number
  completionRate: number
  errorCount: number
  satisfactionScore: number
  aestheticRating: number
  keyObservations: string[]
  painPoints: string[]
}

export interface FeedbackAnalysis {
  totalFeedbackItems: number
  byCategory: {
    positive: number
    negative: number
    suggestions: number
  }
  byType: {
    aesthetic: number
    usability: number
    functionality: number
    performance: number
  }
  byPriority: {
    critical: number
    high: number
    medium: number
    low: number
  }
  topIssues: UserFeedback[]
  commonThemes: string[]
}

export interface Recommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'aesthetic' | 'usability' | 'functionality' | 'performance'
  title: string
  description: string
  rationale: string
  expectedImpact: string
  implementationEffort: 'low' | 'medium' | 'high'
  affectedComponents: string[]
  relatedFeedback: string[]
}

export interface ActionItem {
  id: string
  title: string
  description: string
  assignee?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedHours: number
  dueDate?: Date
  status: 'pending' | 'in-progress' | 'completed'
  relatedRecommendations: string[]
}

export interface ReportAppendix {
  id: string
  title: string
  type: 'data' | 'methodology' | 'screenshots' | 'transcripts'
  content: any
}

export class TestingReportGenerator {
  /**
   * Generate a comprehensive testing report
   */
  generateReport(
    sessions: UserTestingSession[],
    feedback: UserFeedback[],
    reportType: TestingReport['reportType'] = 'comprehensive'
  ): TestingReport {
    const timeRange = this.calculateTimeRange(sessions)
    const summary = this.generateSummary(sessions, feedback)
    const sessionAnalyses = this.analyzeSessions(sessions)
    const feedbackAnalysis = this.analyzeFeedback(feedback)
    const recommendations = this.generateRecommendations(sessions, feedback)
    const actionItems = this.generateActionItems(recommendations)
    const appendices = this.generateAppendices(sessions, feedback)

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date(),
      reportType,
      timeRange,
      summary,
      sessions: sessionAnalyses,
      feedback: feedbackAnalysis,
      recommendations,
      actionItems,
      appendices
    }
  }

  /**
   * Calculate time range from sessions
   */
  private calculateTimeRange(sessions: UserTestingSession[]): { start: Date; end: Date } {
    if (sessions.length === 0) {
      const now = new Date()
      return { start: now, end: now }
    }

    const startTimes = sessions.map(s => s.startTime)
    const endTimes = sessions.map(s => s.endTime || s.startTime)

    return {
      start: new Date(Math.min(...startTimes.map(d => d.getTime()))),
      end: new Date(Math.max(...endTimes.map(d => d.getTime())))
    }
  }

  /**
   * Generate report summary
   */
  private generateSummary(sessions: UserTestingSession[], feedback: UserFeedback[]): ReportSummary {
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const totalDuration = completedSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + (session.endTime.getTime() - session.startTime.getTime())
      }
      return sum
    }, 0)

    // Calculate overall metrics
    const overallMetrics: UsabilityMetrics = {
      taskCompletionRate: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.taskCompletionRate, 0) / completedSessions.length 
        : 0,
      averageTaskTime: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.averageTaskTime, 0) / completedSessions.length 
        : 0,
      errorRate: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.errorRate, 0) / completedSessions.length 
        : 0,
      userSatisfactionScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.userSatisfactionScore, 0) / completedSessions.length 
        : 0,
      systemUsabilityScale: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.systemUsabilityScale, 0) / completedSessions.length 
        : 0,
      netPromoterScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.netPromoterScore, 0) / completedSessions.length 
        : 0,
      aestheticRating: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.aestheticRating, 0) / completedSessions.length 
        : 0,
      learnabilityScore: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.learnabilityScore, 0) / completedSessions.length 
        : 0
    }

    // Generate key findings
    const keyFindings: string[] = []
    
    if (overallMetrics.taskCompletionRate < 80) {
      keyFindings.push(`Task completion rate is ${overallMetrics.taskCompletionRate.toFixed(1)}%, below the 80% target`)
    }
    
    if (overallMetrics.aestheticRating < 4) {
      keyFindings.push(`Aesthetic rating is ${overallMetrics.aestheticRating.toFixed(1)}/5, indicating visual design needs improvement`)
    }
    
    if (overallMetrics.userSatisfactionScore < 4) {
      keyFindings.push(`User satisfaction is ${overallMetrics.userSatisfactionScore.toFixed(1)}/5, below expectations`)
    }

    if (overallMetrics.errorRate > 20) {
      keyFindings.push(`Error rate is ${overallMetrics.errorRate.toFixed(1)}%, indicating usability issues`)
    }

    // Count critical issues
    const criticalIssues = feedback.filter(f => f.priority === 'critical').length

    // Identify improvement areas
    const improvementAreas: string[] = []
    
    if (overallMetrics.aestheticRating < 4) {
      improvementAreas.push('Visual Design & Aesthetics')
    }
    
    if (overallMetrics.taskCompletionRate < 80) {
      improvementAreas.push('Task Flow & Navigation')
    }
    
    if (overallMetrics.errorRate > 20) {
      improvementAreas.push('Interface Usability')
    }

    return {
      totalSessions: sessions.length,
      totalParticipants: new Set(sessions.map(s => s.userId)).size,
      averageSessionDuration: completedSessions.length > 0 ? totalDuration / completedSessions.length / 1000 / 60 : 0, // in minutes
      overallMetrics,
      keyFindings,
      criticalIssues,
      improvementAreas
    }
  }

  /**
   * Analyze individual sessions
   */
  private analyzeSessions(sessions: UserTestingSession[]): SessionAnalysis[] {
    return sessions.map(session => {
      const duration = session.endTime 
        ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60 // in minutes
        : 0

      const completedTasks = session.tasks.filter(task => task.completed)
      const completionRate = session.tasks.length > 0 
        ? (completedTasks.length / session.tasks.length) * 100 
        : 0

      const errorCount = session.tasks.reduce((sum, task) => sum + task.errors.length, 0)

      const satisfactionFeedback = session.feedback.filter(f => f.type === 'usability')
      const satisfactionScore = satisfactionFeedback.length > 0
        ? satisfactionFeedback.reduce((sum, f) => sum + f.rating, 0) / satisfactionFeedback.length
        : 0

      const aestheticFeedback = session.feedback.filter(f => f.type === 'aesthetic')
      const aestheticRating = aestheticFeedback.length > 0
        ? aestheticFeedback.reduce((sum, f) => sum + f.rating, 0) / aestheticFeedback.length
        : 0

      // Generate key observations
      const keyObservations: string[] = []
      
      if (completionRate === 100) {
        keyObservations.push('Completed all tasks successfully')
      } else if (completionRate < 50) {
        keyObservations.push('Struggled with task completion')
      }

      if (errorCount === 0) {
        keyObservations.push('No errors encountered')
      } else if (errorCount > 3) {
        keyObservations.push('Multiple errors encountered')
      }

      if (aestheticRating >= 4) {
        keyObservations.push('Positive aesthetic feedback')
      } else if (aestheticRating < 3) {
        keyObservations.push('Concerns about visual design')
      }

      // Identify pain points
      const painPoints: string[] = []
      
      session.tasks.forEach(task => {
        if (task.errors.length > 0) {
          painPoints.push(`Difficulties with: ${task.title}`)
        }
      })

      session.feedback.filter(f => f.category === 'negative').forEach(f => {
        painPoints.push(f.comment.substring(0, 100) + '...')
      })

      return {
        sessionId: session.id,
        participantId: session.userId,
        scenario: 'General Usability Test', // Could be extracted from session data
        duration,
        completionRate,
        errorCount,
        satisfactionScore,
        aestheticRating,
        keyObservations,
        painPoints
      }
    })
  }

  /**
   * Analyze feedback data
   */
  private analyzeFeedback(feedback: UserFeedback[]): FeedbackAnalysis {
    const byCategory = {
      positive: feedback.filter(f => f.category === 'positive').length,
      negative: feedback.filter(f => f.category === 'negative').length,
      suggestions: feedback.filter(f => f.category === 'suggestion').length
    }

    const byType = {
      aesthetic: feedback.filter(f => f.type === 'aesthetic').length,
      usability: feedback.filter(f => f.type === 'usability').length,
      functionality: feedback.filter(f => f.type === 'functionality').length,
      performance: feedback.filter(f => f.type === 'performance').length
    }

    const byPriority = {
      critical: feedback.filter(f => f.priority === 'critical').length,
      high: feedback.filter(f => f.priority === 'high').length,
      medium: feedback.filter(f => f.priority === 'medium').length,
      low: feedback.filter(f => f.priority === 'low').length
    }

    // Get top issues (negative feedback with high priority)
    const topIssues = feedback
      .filter(f => f.category === 'negative' && (f.priority === 'high' || f.priority === 'critical'))
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 10)

    // Identify common themes
    const commonThemes: string[] = []
    
    if (byType.aesthetic > byType.usability) {
      commonThemes.push('Visual design is a primary concern')
    }
    
    if (byCategory.negative > byCategory.positive) {
      commonThemes.push('More negative than positive feedback')
    }
    
    if (byPriority.critical > 0) {
      commonThemes.push('Critical issues require immediate attention')
    }

    return {
      totalFeedbackItems: feedback.length,
      byCategory,
      byType,
      byPriority,
      topIssues,
      commonThemes
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(sessions: UserTestingSession[], feedback: UserFeedback[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Calculate overall metrics for recommendations
    const completedSessions = sessions.filter(s => s.status === 'completed')
    const avgTaskCompletion = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.metrics.taskCompletionRate, 0) / completedSessions.length 
      : 0
    const avgAestheticRating = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.metrics.aestheticRating, 0) / completedSessions.length 
      : 0
    const avgErrorRate = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.metrics.errorRate, 0) / completedSessions.length 
      : 0
    const avgSatisfaction = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.metrics.userSatisfactionScore, 0) / completedSessions.length 
      : 0

    // Aesthetic recommendations
    if (avgAestheticRating < 4) {
      recommendations.push({
        id: 'aesthetic-improvement',
        priority: avgAestheticRating < 3 ? 'critical' : 'high',
        category: 'aesthetic',
        title: 'Improve Visual Design and Aesthetics',
        description: 'Enhance the visual appeal and professional appearance of the interface',
        rationale: `Current aesthetic rating is ${avgAestheticRating.toFixed(1)}/5, below the target of 4.0`,
        expectedImpact: 'Improved user perception, increased trust, better brand image',
        implementationEffort: 'medium',
        affectedComponents: ['buttons', 'cards', 'navigation', 'forms'],
        relatedFeedback: feedback.filter(f => f.type === 'aesthetic' && f.category === 'negative').map(f => f.id)
      })
    }

    // Usability recommendations
    if (avgTaskCompletion < 80) {
      recommendations.push({
        id: 'task-flow-improvement',
        priority: avgTaskCompletion < 60 ? 'critical' : 'high',
        category: 'usability',
        title: 'Optimize Task Flows and Navigation',
        description: 'Simplify user workflows and improve navigation clarity',
        rationale: `Task completion rate is ${avgTaskCompletion.toFixed(1)}%, below the target of 80%`,
        expectedImpact: 'Higher task completion rates, reduced user frustration',
        implementationEffort: 'high',
        affectedComponents: ['navigation', 'workflows', 'forms'],
        relatedFeedback: feedback.filter(f => f.type === 'usability' && f.category === 'negative').map(f => f.id)
      })
    }

    // Error rate recommendations
    if (avgErrorRate > 20) {
      recommendations.push({
        id: 'error-reduction',
        priority: avgErrorRate > 30 ? 'critical' : 'high',
        category: 'usability',
        title: 'Reduce User Errors and Improve Feedback',
        description: 'Implement better error prevention and clearer user feedback',
        rationale: `Error rate is ${avgErrorRate.toFixed(1)}%, above the acceptable threshold of 20%`,
        expectedImpact: 'Fewer user errors, smoother user experience',
        implementationEffort: 'medium',
        affectedComponents: ['forms', 'validation', 'feedback-systems'],
        relatedFeedback: feedback.filter(f => f.category === 'negative').map(f => f.id)
      })
    }

    // Satisfaction recommendations
    if (avgSatisfaction < 4) {
      recommendations.push({
        id: 'satisfaction-improvement',
        priority: avgSatisfaction < 3 ? 'critical' : 'medium',
        category: 'usability',
        title: 'Enhance Overall User Experience',
        description: 'Focus on improving user satisfaction through better interactions',
        rationale: `User satisfaction is ${avgSatisfaction.toFixed(1)}/5, below the target of 4.0`,
        expectedImpact: 'Higher user satisfaction, increased user retention',
        implementationEffort: 'medium',
        affectedComponents: ['interactions', 'animations', 'feedback'],
        relatedFeedback: feedback.filter(f => f.type === 'usability').map(f => f.id)
      })
    }

    return recommendations
  }

  /**
   * Generate actionable items from recommendations
   */
  private generateActionItems(recommendations: Recommendation[]): ActionItem[] {
    const actionItems: ActionItem[] = []

    recommendations.forEach(rec => {
      switch (rec.category) {
        case 'aesthetic':
          actionItems.push({
            id: `action-${rec.id}-colors`,
            title: 'Review and update color palette',
            description: 'Audit current colors and implement a more sophisticated palette',
            priority: rec.priority,
            estimatedHours: 16,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          
          actionItems.push({
            id: `action-${rec.id}-typography`,
            title: 'Improve typography system',
            description: 'Implement better font choices and hierarchy',
            priority: rec.priority,
            estimatedHours: 12,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          break

        case 'usability':
          actionItems.push({
            id: `action-${rec.id}-navigation`,
            title: 'Redesign navigation structure',
            description: 'Simplify and clarify navigation patterns',
            priority: rec.priority,
            estimatedHours: 24,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          
          actionItems.push({
            id: `action-${rec.id}-forms`,
            title: 'Optimize form interactions',
            description: 'Improve form validation and user feedback',
            priority: rec.priority,
            estimatedHours: 20,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          break

        case 'functionality':
          actionItems.push({
            id: `action-${rec.id}-features`,
            title: 'Fix functionality issues',
            description: 'Address reported functional problems',
            priority: rec.priority,
            estimatedHours: 32,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          break

        case 'performance':
          actionItems.push({
            id: `action-${rec.id}-performance`,
            title: 'Optimize performance',
            description: 'Improve loading times and responsiveness',
            priority: rec.priority,
            estimatedHours: 40,
            status: 'pending',
            relatedRecommendations: [rec.id]
          })
          break
      }
    })

    return actionItems
  }

  /**
   * Generate report appendices
   */
  private generateAppendices(sessions: UserTestingSession[], feedback: UserFeedback[]): ReportAppendix[] {
    return [
      {
        id: 'raw-data',
        title: 'Raw Session Data',
        type: 'data',
        content: sessions
      },
      {
        id: 'feedback-data',
        title: 'User Feedback Data',
        type: 'data',
        content: feedback
      },
      {
        id: 'methodology',
        title: 'Testing Methodology',
        type: 'methodology',
        content: {
          approach: 'Moderated usability testing with task-based scenarios',
          participants: 'Target users representing key personas',
          duration: '15-30 minutes per session',
          metrics: ['Task completion rate', 'Error rate', 'Satisfaction score', 'Aesthetic rating'],
          tools: ['Screen recording', 'Think-aloud protocol', 'Post-task questionnaires']
        }
      }
    ]
  }

  /**
   * Export report to different formats
   */
  exportReport(report: TestingReport, format: 'json' | 'html' | 'pdf' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      
      case 'html':
        return this.generateHTMLReport(report)
      
      case 'pdf':
        // In a real implementation, this would generate a PDF
        return 'PDF export not implemented in this demo'
      
      default:
        return JSON.stringify(report, null, 2)
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: TestingReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Usability Testing Report - ${report.generatedAt.toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .recommendation { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #007cba; }
        .critical { border-left-color: #d32f2f; }
        .high { border-left-color: #f57c00; }
        .medium { border-left-color: #fbc02d; }
        .low { border-left-color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Usability Testing Report</h1>
        <p>Generated: ${report.generatedAt.toLocaleString()}</p>
        <p>Report Type: ${report.reportType}</p>
        <p>Time Range: ${report.timeRange.start.toLocaleDateString()} - ${report.timeRange.end.toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric">
            <strong>Total Sessions:</strong> ${report.summary.totalSessions}
        </div>
        <div class="metric">
            <strong>Participants:</strong> ${report.summary.totalParticipants}
        </div>
        <div class="metric">
            <strong>Avg Duration:</strong> ${report.summary.averageSessionDuration.toFixed(1)} min
        </div>
        <div class="metric">
            <strong>Task Completion:</strong> ${report.summary.overallMetrics.taskCompletionRate.toFixed(1)}%
        </div>
        <div class="metric">
            <strong>Satisfaction:</strong> ${report.summary.overallMetrics.userSatisfactionScore.toFixed(1)}/5
        </div>
        <div class="metric">
            <strong>Aesthetic Rating:</strong> ${report.summary.overallMetrics.aestheticRating.toFixed(1)}/5
        </div>
    </div>

    <div class="section">
        <h2>Key Findings</h2>
        <ul>
            ${report.summary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h3>${rec.title}</h3>
                <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
                <p><strong>Category:</strong> ${rec.category}</p>
                <p>${rec.description}</p>
                <p><strong>Rationale:</strong> ${rec.rationale}</p>
                <p><strong>Expected Impact:</strong> ${rec.expectedImpact}</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Action Items</h2>
        <ul>
            ${report.actionItems.map(item => `
                <li>
                    <strong>${item.title}</strong> (${item.priority}) - ${item.estimatedHours}h
                    <br>${item.description}
                </li>
            `).join('')}
        </ul>
    </div>
</body>
</html>
    `
  }
}

// Global instance
export const reportGenerator = new TestingReportGenerator()