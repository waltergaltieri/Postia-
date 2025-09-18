/**
 * Usability Testing Framework
 * Provides tools for conducting user testing sessions and collecting feedback
 */

export interface UserTestingSession {
  id: string
  userId: string
  sessionType: 'moderated' | 'unmoderated' | 'a-b-test'
  startTime: Date
  endTime?: Date
  tasks: TestTask[]
  feedback: UserFeedback[]
  metrics: UsabilityMetrics
  status: 'active' | 'completed' | 'abandoned'
}

export interface TestTask {
  id: string
  title: string
  description: string
  expectedOutcome: string
  startTime?: Date
  endTime?: Date
  completed: boolean
  difficulty: 1 | 2 | 3 | 4 | 5
  errors: TaskError[]
  userPath: UserAction[]
}

export interface UserFeedback {
  id: string
  type: 'aesthetic' | 'usability' | 'functionality' | 'performance'
  category: 'positive' | 'negative' | 'suggestion'
  component?: string
  page?: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface UsabilityMetrics {
  taskCompletionRate: number
  averageTaskTime: number
  errorRate: number
  userSatisfactionScore: number
  systemUsabilityScale: number
  netPromoterScore: number
  aestheticRating: number
  learnabilityScore: number
}

export interface TaskError {
  id: string
  type: 'navigation' | 'interaction' | 'understanding' | 'technical'
  description: string
  timestamp: Date
  resolved: boolean
  impact: 'low' | 'medium' | 'high'
}

export interface UserAction {
  timestamp: Date
  action: 'click' | 'scroll' | 'hover' | 'type' | 'navigate'
  element: string
  page: string
  coordinates?: { x: number; y: number }
  value?: string
}

export interface TestingScenario {
  id: string
  name: string
  description: string
  userPersona: string
  tasks: TestTask[]
  successCriteria: string[]
  estimatedDuration: number
}

// Predefined testing scenarios for Postia
export const POSTIA_TESTING_SCENARIOS: TestingScenario[] = [
  {
    id: 'content-creation-flow',
    name: 'Content Creation Workflow',
    description: 'Test the complete flow from idea to published content',
    userPersona: 'Marketing Manager',
    tasks: [
      {
        id: 'task-1',
        title: 'Create New Campaign',
        description: 'Create a new social media campaign for a client',
        expectedOutcome: 'Successfully create and configure a new campaign',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      },
      {
        id: 'task-2',
        title: 'Generate Content with AI',
        description: 'Use AI to generate social media posts for the campaign',
        expectedOutcome: 'Generate at least 3 pieces of content using AI',
        completed: false,
        difficulty: 3,
        errors: [],
        userPath: []
      },
      {
        id: 'task-3',
        title: 'Review and Edit Content',
        description: 'Review generated content and make necessary edits',
        expectedOutcome: 'Successfully edit and approve content',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      },
      {
        id: 'task-4',
        title: 'Schedule Publication',
        description: 'Schedule the content for publication using the calendar',
        expectedOutcome: 'Successfully schedule content for future publication',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      }
    ],
    successCriteria: [
      'Complete all tasks within 15 minutes',
      'No critical errors encountered',
      'User satisfaction score > 4/5'
    ],
    estimatedDuration: 15
  },
  {
    id: 'client-management',
    name: 'Client and Brand Management',
    description: 'Test client switching and brand consistency features',
    userPersona: 'Agency Owner',
    tasks: [
      {
        id: 'task-1',
        title: 'Switch Between Clients',
        description: 'Navigate between different client accounts',
        expectedOutcome: 'Successfully switch between at least 2 clients',
        completed: false,
        difficulty: 1,
        errors: [],
        userPath: []
      },
      {
        id: 'task-2',
        title: 'Upload Brand Assets',
        description: 'Upload logos and brand assets for a client',
        expectedOutcome: 'Successfully upload and organize brand assets',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      },
      {
        id: 'task-3',
        title: 'Apply Brand Guidelines',
        description: 'Generate content that follows client brand guidelines',
        expectedOutcome: 'Content reflects client branding consistently',
        completed: false,
        difficulty: 3,
        errors: [],
        userPath: []
      }
    ],
    successCriteria: [
      'Complete all tasks within 10 minutes',
      'Brand consistency maintained throughout',
      'Intuitive navigation between clients'
    ],
    estimatedDuration: 10
  },
  {
    id: 'mobile-experience',
    name: 'Mobile User Experience',
    description: 'Test the mobile interface and touch interactions',
    userPersona: 'Account Executive',
    tasks: [
      {
        id: 'task-1',
        title: 'Review Content on Mobile',
        description: 'Review and approve content using mobile device',
        expectedOutcome: 'Successfully review and approve content on mobile',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      },
      {
        id: 'task-2',
        title: 'Use Touch Gestures',
        description: 'Navigate using swipe and touch gestures',
        expectedOutcome: 'Intuitive gesture-based navigation',
        completed: false,
        difficulty: 2,
        errors: [],
        userPath: []
      }
    ],
    successCriteria: [
      'All interactions work smoothly on mobile',
      'Touch targets are appropriately sized',
      'Content is easily readable on small screens'
    ],
    estimatedDuration: 8
  }
]

export class UsabilityTestingManager {
  private sessions: Map<string, UserTestingSession> = new Map()
  private feedback: UserFeedback[] = []

  /**
   * Start a new user testing session
   */
  startSession(
    userId: string,
    sessionType: UserTestingSession['sessionType'],
    scenario: TestingScenario
  ): UserTestingSession {
    const session: UserTestingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionType,
      startTime: new Date(),
      tasks: scenario.tasks,
      feedback: [],
      metrics: {
        taskCompletionRate: 0,
        averageTaskTime: 0,
        errorRate: 0,
        userSatisfactionScore: 0,
        systemUsabilityScale: 0,
        netPromoterScore: 0,
        aestheticRating: 0,
        learnabilityScore: 0
      },
      status: 'active'
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Record user action during testing
   */
  recordUserAction(sessionId: string, action: UserAction): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // Find current active task
    const activeTask = session.tasks.find(task => task.startTime && !task.endTime)
    if (activeTask) {
      activeTask.userPath.push(action)
    }
  }

  /**
   * Start a specific task
   */
  startTask(sessionId: string, taskId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      task.startTime = new Date()
    }
  }

  /**
   * Complete a task
   */
  completeTask(sessionId: string, taskId: string, difficulty: number): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      task.endTime = new Date()
      task.completed = true
      task.difficulty = difficulty as 1 | 2 | 3 | 4 | 5
    }

    this.updateSessionMetrics(sessionId)
  }

  /**
   * Record an error during task execution
   */
  recordError(sessionId: string, taskId: string, error: Omit<TaskError, 'id'>): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const task = session.tasks.find(t => t.id === taskId)
    if (task) {
      const taskError: TaskError = {
        id: `error-${Date.now()}`,
        ...error
      }
      task.errors.push(taskError)
    }
  }

  /**
   * Add user feedback
   */
  addFeedback(sessionId: string, feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const userFeedback: UserFeedback = {
      id: `feedback-${Date.now()}`,
      timestamp: new Date(),
      ...feedback
    }

    session.feedback.push(userFeedback)
    this.feedback.push(userFeedback)
  }

  /**
   * End testing session
   */
  endSession(sessionId: string): UserTestingSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    session.endTime = new Date()
    session.status = 'completed'
    this.updateSessionMetrics(sessionId)

    return session
  }

  /**
   * Update session metrics based on completed tasks and feedback
   */
  private updateSessionMetrics(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const completedTasks = session.tasks.filter(task => task.completed)
    const totalTasks = session.tasks.length

    // Task completion rate
    session.metrics.taskCompletionRate = (completedTasks.length / totalTasks) * 100

    // Average task time
    const taskTimes = completedTasks
      .filter(task => task.startTime && task.endTime)
      .map(task => (task.endTime!.getTime() - task.startTime!.getTime()) / 1000)
    
    session.metrics.averageTaskTime = taskTimes.length > 0 
      ? taskTimes.reduce((sum, time) => sum + time, 0) / taskTimes.length 
      : 0

    // Error rate
    const totalErrors = session.tasks.reduce((sum, task) => sum + task.errors.length, 0)
    session.metrics.errorRate = totalTasks > 0 ? (totalErrors / totalTasks) * 100 : 0

    // User satisfaction (average of feedback ratings)
    const satisfactionRatings = session.feedback
      .filter(f => f.type === 'usability')
      .map(f => f.rating)
    
    session.metrics.userSatisfactionScore = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0

    // Aesthetic rating (average of aesthetic feedback)
    const aestheticRatings = session.feedback
      .filter(f => f.type === 'aesthetic')
      .map(f => f.rating)
    
    session.metrics.aestheticRating = aestheticRatings.length > 0
      ? aestheticRatings.reduce((sum, rating) => sum + rating, 0) / aestheticRatings.length
      : 0
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(sessionId: string): UserTestingSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Get all feedback by category
   */
  getFeedbackByCategory(category: UserFeedback['category']): UserFeedback[] {
    return this.feedback.filter(f => f.category === category)
  }

  /**
   * Get feedback by component
   */
  getFeedbackByComponent(component: string): UserFeedback[] {
    return this.feedback.filter(f => f.component === component)
  }

  /**
   * Generate usability report
   */
  generateUsabilityReport(): {
    overallMetrics: UsabilityMetrics
    topIssues: UserFeedback[]
    recommendations: string[]
    completedSessions: number
  } {
    const completedSessions = Array.from(this.sessions.values())
      .filter(session => session.status === 'completed')

    if (completedSessions.length === 0) {
      return {
        overallMetrics: {
          taskCompletionRate: 0,
          averageTaskTime: 0,
          errorRate: 0,
          userSatisfactionScore: 0,
          systemUsabilityScale: 0,
          netPromoterScore: 0,
          aestheticRating: 0,
          learnabilityScore: 0
        },
        topIssues: [],
        recommendations: [],
        completedSessions: 0
      }
    }

    // Calculate overall metrics
    const overallMetrics: UsabilityMetrics = {
      taskCompletionRate: completedSessions.reduce((sum, s) => sum + s.metrics.taskCompletionRate, 0) / completedSessions.length,
      averageTaskTime: completedSessions.reduce((sum, s) => sum + s.metrics.averageTaskTime, 0) / completedSessions.length,
      errorRate: completedSessions.reduce((sum, s) => sum + s.metrics.errorRate, 0) / completedSessions.length,
      userSatisfactionScore: completedSessions.reduce((sum, s) => sum + s.metrics.userSatisfactionScore, 0) / completedSessions.length,
      systemUsabilityScale: completedSessions.reduce((sum, s) => sum + s.metrics.systemUsabilityScale, 0) / completedSessions.length,
      netPromoterScore: completedSessions.reduce((sum, s) => sum + s.metrics.netPromoterScore, 0) / completedSessions.length,
      aestheticRating: completedSessions.reduce((sum, s) => sum + s.metrics.aestheticRating, 0) / completedSessions.length,
      learnabilityScore: completedSessions.reduce((sum, s) => sum + s.metrics.learnabilityScore, 0) / completedSessions.length
    }

    // Get top issues (negative feedback with high priority)
    const topIssues = this.feedback
      .filter(f => f.category === 'negative' && (f.priority === 'high' || f.priority === 'critical'))
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 10)

    // Generate recommendations based on metrics and feedback
    const recommendations: string[] = []

    if (overallMetrics.taskCompletionRate < 80) {
      recommendations.push('Improve task flow clarity - completion rate is below 80%')
    }

    if (overallMetrics.errorRate > 20) {
      recommendations.push('Reduce interaction complexity - error rate is above 20%')
    }

    if (overallMetrics.userSatisfactionScore < 4) {
      recommendations.push('Focus on user experience improvements - satisfaction score is below 4/5')
    }

    if (overallMetrics.aestheticRating < 4) {
      recommendations.push('Enhance visual design - aesthetic rating is below 4/5')
    }

    return {
      overallMetrics,
      topIssues,
      recommendations,
      completedSessions: completedSessions.length
    }
  }
}

// Global instance
export const usabilityTesting = new UsabilityTestingManager()