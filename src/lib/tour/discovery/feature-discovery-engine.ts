'use client'

/**
 * Feature definition for discovery system
 */
export interface FeatureDefinition {
  id: string
  name: string
  description: string
  category: 'core' | 'advanced' | 'premium' | 'new'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Discovery criteria
  requiredRole?: string[]
  requiredPermissions?: string[]
  minimumUsageLevel?: 'beginner' | 'intermediate' | 'advanced'
  
  // Usage tracking
  usageIndicators: string[] // CSS selectors or event names that indicate usage
  relatedFeatures: string[] // IDs of related features
  
  // Tour information
  tourId?: string
  introductionMessage: string
  benefitsDescription: string
  
  // Timing and conditions
  suggestAfterDays?: number // Days after user registration
  suggestAfterFeatureUsage?: { featureId: string, usageCount: number }[]
  maxSuggestionsPerUser?: number
  
  // Metadata
  version: string
  addedDate: Date
  deprecatedDate?: Date
  isExperimental?: boolean
}

/**
 * User feature usage data
 */
export interface UserFeatureUsage {
  userId: string
  featureUsage: Map<string, {
    firstUsed: Date
    lastUsed: Date
    usageCount: number
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced'
    completedTours: string[]
  }>
  
  // Discovery history
  suggestedFeatures: Map<string, {
    firstSuggested: Date
    lastSuggested: Date
    suggestionCount: number
    dismissed: boolean
    dismissedReason?: string
    accepted: boolean
    acceptedDate?: Date
  }>
  
  // User context
  registrationDate: Date
  currentRole: string
  permissions: string[]
  preferences: {
    enableFeatureDiscovery: boolean
    discoveryFrequency: 'low' | 'medium' | 'high'
    preferredCategories: string[]
  }
}

/**
 * Feature discovery recommendation
 */
export interface FeatureDiscoveryRecommendation {
  featureId: string
  feature: FeatureDefinition
  reason: 'unused_feature' | 'related_feature' | 'new_feature' | 'upgrade_opportunity' | 'workflow_optimization'
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Messaging
  title: string
  message: string
  benefits: string[]
  
  // Timing
  suggestedDelay: number
  expiresAt: Date
  
  // Context
  triggerContext: {
    currentPage: string
    recentActivity: string[]
    relatedUsage: string[]
  }
  
  // Metadata
  createdAt: Date
  metadata: Record<string, any>
}

/**
 * What's new item for feature updates
 */
export interface WhatsNewItem {
  id: string
  type: 'feature' | 'improvement' | 'fix' | 'announcement'
  title: string
  description: string
  detailedDescription?: string
  
  // Targeting
  targetRoles?: string[]
  targetUserSegments?: string[]
  minimumVersion?: string
  
  // Media
  imageUrl?: string
  videoUrl?: string
  demoUrl?: string
  
  // Tour integration
  tourId?: string
  highlightSelectors?: string[]
  
  // Timing
  publishDate: Date
  expiryDate?: Date
  priority: 'low' | 'medium' | 'high'
  
  // Tracking
  viewCount?: number
  interactionCount?: number
  tourStartCount?: number
}

/**
 * Configuration for feature discovery engine
 */
export interface FeatureDiscoveryConfig {
  enableFeatureDiscovery: boolean
  enableWhatsNew: boolean
  enablePersonalization: boolean
  
  // Discovery timing
  maxRecommendationsPerSession: number
  recommendationCooldownPeriod: number // milliseconds
  newUserGracePeriod: number // days
  
  // Scoring weights
  usagePatternWeight: number
  recencyWeight: number
  popularityWeight: number
  personalizedWeight: number
  
  // Thresholds
  minimumConfidenceThreshold: number
  unusedFeatureThreshold: number // days
  relatedFeatureThreshold: number // usage count
  
  // What's new settings
  whatsNewRetentionDays: number
  maxWhatsNewItems: number
}

/**
 * Feature discovery engine for intelligent feature suggestions
 * Implements requirements 2.3, 8.5 for feature discovery and "what's new" systems
 */
export class FeatureDiscoveryEngine {
  private config: FeatureDiscoveryConfig
  private features: Map<string, FeatureDefinition>
  private userUsage: UserFeatureUsage
  private whatsNewItems: Map<string, WhatsNewItem>
  private recommendationHistory: FeatureDiscoveryRecommendation[] = []

  constructor(
    config: Partial<FeatureDiscoveryConfig> = {},
    initialFeatures: FeatureDefinition[] = [],
    userId: string = 'current-user'
  ) {
    this.config = {
      enableFeatureDiscovery: true,
      enableWhatsNew: true,
      enablePersonalization: true,
      maxRecommendationsPerSession: 2,
      recommendationCooldownPeriod: 1800000, // 30 minutes
      newUserGracePeriod: 7, // days
      usagePatternWeight: 0.4,
      recencyWeight: 0.3,
      popularityWeight: 0.2,
      personalizedWeight: 0.1,
      minimumConfidenceThreshold: 0.6,
      unusedFeatureThreshold: 14, // days
      relatedFeatureThreshold: 3,
      whatsNewRetentionDays: 30,
      maxWhatsNewItems: 10,
      ...config
    }

    this.features = new Map()
    initialFeatures.forEach(feature => this.features.set(feature.id, feature))

    this.userUsage = this.initializeUserUsage(userId)
    this.whatsNewItems = new Map()

    // Initialize with default features
    this.initializeDefaultFeatures()
    this.initializeDefaultWhatsNew()
  }

  /**
   * Initialize user usage data
   */
  private initializeUserUsage(userId: string): UserFeatureUsage {
    // In a real implementation, this would load from storage/API
    return {
      userId,
      featureUsage: new Map(),
      suggestedFeatures: new Map(),
      registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      currentRole: 'editor', // Would be loaded from user context
      permissions: ['content:create', 'campaigns:view', 'analytics:view'],
      preferences: {
        enableFeatureDiscovery: true,
        discoveryFrequency: 'medium',
        preferredCategories: ['core', 'advanced']
      }
    }
  }

  /**
   * Initialize default features for discovery
   */
  private initializeDefaultFeatures(): void {
    const defaultFeatures: FeatureDefinition[] = [
      {
        id: 'ai-content-generation',
        name: 'Generación de Contenido con IA',
        description: 'Crea contenido automáticamente usando inteligencia artificial',
        category: 'core',
        priority: 'high',
        usageIndicators: ['[data-feature="ai-content"]', '.content-generator'],
        relatedFeatures: ['content-optimization', 'content-calendar'],
        tourId: 'content-generation-tour',
        introductionMessage: 'Descubre cómo la IA puede acelerar tu creación de contenido',
        benefitsDescription: 'Ahorra tiempo y mejora la calidad de tu contenido con sugerencias inteligentes',
        suggestAfterDays: 3,
        maxSuggestionsPerUser: 3,
        version: '1.0',
        addedDate: new Date('2024-01-01')
      },
      {
        id: 'campaign-automation',
        name: 'Automatización de Campañas',
        description: 'Automatiza tus campañas de marketing con reglas inteligentes',
        category: 'advanced',
        priority: 'medium',
        requiredRole: ['admin', 'manager'],
        usageIndicators: ['[data-feature="automation"]', '.campaign-automation'],
        relatedFeatures: ['campaign-management', 'analytics-dashboard'],
        tourId: 'campaign-automation-tour',
        introductionMessage: 'Automatiza tus campañas para mayor eficiencia',
        benefitsDescription: 'Configura reglas una vez y deja que el sistema maneje tus campañas',
        suggestAfterFeatureUsage: [{ featureId: 'campaign-management', usageCount: 5 }],
        maxSuggestionsPerUser: 2,
        version: '1.2',
        addedDate: new Date('2024-02-15')
      },
      {
        id: 'advanced-analytics',
        name: 'Analytics Avanzados',
        description: 'Obtén insights profundos sobre el rendimiento de tu contenido',
        category: 'premium',
        priority: 'medium',
        requiredPermissions: ['analytics:advanced'],
        usageIndicators: ['[data-feature="advanced-analytics"]', '.analytics-advanced'],
        relatedFeatures: ['basic-analytics', 'reporting'],
        tourId: 'advanced-analytics-tour',
        introductionMessage: 'Descubre métricas avanzadas para optimizar tu estrategia',
        benefitsDescription: 'Toma decisiones basadas en datos con análisis detallados',
        suggestAfterDays: 14,
        maxSuggestionsPerUser: 2,
        version: '1.1',
        addedDate: new Date('2024-03-01')
      },
      {
        id: 'collaboration-tools',
        name: 'Herramientas de Colaboración',
        description: 'Colabora en tiempo real con tu equipo',
        category: 'core',
        priority: 'medium',
        usageIndicators: ['[data-feature="collaboration"]', '.collaboration-panel'],
        relatedFeatures: ['team-management', 'comments-system'],
        tourId: 'collaboration-tour',
        introductionMessage: 'Mejora la colaboración en equipo con estas herramientas',
        benefitsDescription: 'Trabaja de forma más eficiente con comentarios y edición colaborativa',
        suggestAfterDays: 7,
        maxSuggestionsPerUser: 2,
        version: '1.0',
        addedDate: new Date('2024-01-15')
      },
      {
        id: 'mobile-app',
        name: 'Aplicación Móvil',
        description: 'Gestiona tu contenido desde cualquier lugar',
        category: 'new',
        priority: 'low',
        usageIndicators: [], // External app
        relatedFeatures: ['content-management', 'notifications'],
        introductionMessage: 'Lleva tu trabajo contigo con nuestra app móvil',
        benefitsDescription: 'Revisa, aprueba y publica contenido desde tu teléfono',
        suggestAfterDays: 21,
        maxSuggestionsPerUser: 1,
        version: '2.0',
        addedDate: new Date('2024-04-01'),
        isExperimental: false
      }
    ]

    defaultFeatures.forEach(feature => this.features.set(feature.id, feature))
  }

  /**
   * Initialize default "what's new" items
   */
  private initializeDefaultWhatsNew(): void {
    const defaultWhatsNew: WhatsNewItem[] = [
      {
        id: 'ai-improvements-v2',
        type: 'improvement',
        title: 'IA Mejorada para Generación de Contenido',
        description: 'Nuevos modelos de IA más precisos y creativos',
        detailedDescription: 'Hemos actualizado nuestros modelos de IA para generar contenido más relevante y creativo. Ahora incluye soporte para más idiomas y tonos de voz.',
        targetRoles: ['editor', 'content-creator'],
        tourId: 'ai-improvements-tour',
        highlightSelectors: ['[data-feature="ai-content"]'],
        publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        priority: 'high'
      },
      {
        id: 'new-dashboard-widgets',
        type: 'feature',
        title: 'Nuevos Widgets de Dashboard',
        description: 'Personaliza tu dashboard con widgets interactivos',
        detailedDescription: 'Añade widgets personalizables a tu dashboard para ver métricas importantes de un vistazo.',
        tourId: 'dashboard-widgets-tour',
        highlightSelectors: ['[data-feature="dashboard-widgets"]'],
        publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        priority: 'medium'
      },
      {
        id: 'performance-improvements',
        type: 'improvement',
        title: 'Mejoras de Rendimiento',
        description: 'La aplicación ahora es 40% más rápida',
        detailedDescription: 'Hemos optimizado el código para mejorar significativamente los tiempos de carga y la respuesta de la interfaz.',
        publishDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        priority: 'low'
      }
    ]

    defaultWhatsNew.forEach(item => this.whatsNewItems.set(item.id, item))
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(featureId: string): void {
    if (!this.features.has(featureId)) return

    const existing = this.userUsage.featureUsage.get(featureId)
    const now = new Date()

    if (existing) {
      existing.lastUsed = now
      existing.usageCount++
      
      // Update proficiency level based on usage
      if (existing.usageCount >= 20) {
        existing.proficiencyLevel = 'advanced'
      } else if (existing.usageCount >= 5) {
        existing.proficiencyLevel = 'intermediate'
      }
    } else {
      this.userUsage.featureUsage.set(featureId, {
        firstUsed: now,
        lastUsed: now,
        usageCount: 1,
        proficiencyLevel: 'beginner',
        completedTours: []
      })
    }
  }

  /**
   * Get unused features for the user
   */
  public getUnusedFeatures(): FeatureDefinition[] {
    const unusedFeatures: FeatureDefinition[] = []
    const now = Date.now()
    const thresholdTime = now - (this.config.unusedFeatureThreshold * 24 * 60 * 60 * 1000)

    for (const [featureId, feature] of this.features) {
      const usage = this.userUsage.featureUsage.get(featureId)
      
      // Check if feature is unused or not used recently
      const isUnused = !usage || usage.lastUsed.getTime() < thresholdTime
      
      // Check if user has required permissions/role
      const hasPermissions = this.userHasAccess(feature)
      
      // Check if feature is not deprecated
      const isActive = !feature.deprecatedDate || feature.deprecatedDate > new Date()
      
      if (isUnused && hasPermissions && isActive) {
        unusedFeatures.push(feature)
      }
    }

    return unusedFeatures.sort((a, b) => {
      // Sort by priority and category
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const categoryOrder = { core: 4, new: 3, advanced: 2, premium: 1 }
      
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      const aCategory = categoryOrder[a.category]
      const bCategory = categoryOrder[b.category]
      
      return bCategory - aCategory
    })
  }

  /**
   * Generate feature discovery recommendations
   */
  public generateRecommendations(): FeatureDiscoveryRecommendation[] {
    if (!this.config.enableFeatureDiscovery || !this.userUsage.preferences.enableFeatureDiscovery) {
      return []
    }

    const recommendations: FeatureDiscoveryRecommendation[] = []
    
    // Get unused features
    const unusedFeatures = this.getUnusedFeatures()
    
    // Generate recommendations for unused features
    for (const feature of unusedFeatures.slice(0, this.config.maxRecommendationsPerSession)) {
      const recommendation = this.createFeatureRecommendation(feature, 'unused_feature')
      if (recommendation && recommendation.confidence >= this.config.minimumConfidenceThreshold) {
        recommendations.push(recommendation)
      }
    }
    
    // Generate recommendations for related features
    const relatedRecommendations = this.generateRelatedFeatureRecommendations()
    recommendations.push(...relatedRecommendations)
    
    // Generate recommendations for new features
    const newFeatureRecommendations = this.generateNewFeatureRecommendations()
    recommendations.push(...newFeatureRecommendations)
    
    // Sort by confidence and priority
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        return b.confidence - a.confidence
      })
      .slice(0, this.config.maxRecommendationsPerSession)
  }

  /**
   * Generate recommendations for related features
   */
  private generateRelatedFeatureRecommendations(): FeatureDiscoveryRecommendation[] {
    const recommendations: FeatureDiscoveryRecommendation[] = []
    
    // Find features user uses frequently
    const frequentlyUsedFeatures = Array.from(this.userUsage.featureUsage.entries())
      .filter(([_, usage]) => usage.usageCount >= this.config.relatedFeatureThreshold)
      .map(([featureId, _]) => featureId)
    
    for (const usedFeatureId of frequentlyUsedFeatures) {
      const usedFeature = this.features.get(usedFeatureId)
      if (!usedFeature) continue
      
      // Find related features that are unused
      for (const relatedFeatureId of usedFeature.relatedFeatures) {
        const relatedFeature = this.features.get(relatedFeatureId)
        if (!relatedFeature) continue
        
        const isUnused = !this.userUsage.featureUsage.has(relatedFeatureId)
        const hasAccess = this.userHasAccess(relatedFeature)
        
        if (isUnused && hasAccess) {
          const recommendation = this.createFeatureRecommendation(relatedFeature, 'related_feature')
          if (recommendation && recommendation.confidence >= this.config.minimumConfidenceThreshold) {
            recommendations.push(recommendation)
          }
        }
      }
    }
    
    return recommendations
  }

  /**
   * Generate recommendations for new features
   */
  private generateNewFeatureRecommendations(): FeatureDiscoveryRecommendation[] {
    const recommendations: FeatureDiscoveryRecommendation[] = []
    const now = Date.now()
    const newFeatureThreshold = now - (30 * 24 * 60 * 60 * 1000) // 30 days
    
    for (const [featureId, feature] of this.features) {
      // Check if feature is new
      const isNew = feature.addedDate.getTime() > newFeatureThreshold || feature.category === 'new'
      
      // Check if user hasn't used it yet
      const isUnused = !this.userUsage.featureUsage.has(featureId)
      
      // Check if user has access
      const hasAccess = this.userHasAccess(feature)
      
      if (isNew && isUnused && hasAccess) {
        const recommendation = this.createFeatureRecommendation(feature, 'new_feature')
        if (recommendation && recommendation.confidence >= this.config.minimumConfidenceThreshold) {
          recommendations.push(recommendation)
        }
      }
    }
    
    return recommendations
  }

  /**
   * Create a feature recommendation
   */
  private createFeatureRecommendation(
    feature: FeatureDefinition,
    reason: FeatureDiscoveryRecommendation['reason']
  ): FeatureDiscoveryRecommendation | null {
    // Check if already suggested recently
    const suggestion = this.userUsage.suggestedFeatures.get(feature.id)
    if (suggestion && suggestion.dismissed) {
      return null
    }
    
    // Check suggestion limits
    if (suggestion && feature.maxSuggestionsPerUser && 
        suggestion.suggestionCount >= feature.maxSuggestionsPerUser) {
      return null
    }
    
    // Calculate confidence score
    const confidence = this.calculateFeatureConfidence(feature, reason)
    
    // Generate messaging
    const messaging = this.generateFeatureMessaging(feature, reason)
    
    return {
      featureId: feature.id,
      feature,
      reason,
      confidence,
      priority: feature.priority,
      ...messaging,
      suggestedDelay: this.calculateSuggestionDelay(feature, reason),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      triggerContext: {
        currentPage: window.location.pathname,
        recentActivity: this.getRecentActivity(),
        relatedUsage: this.getRelatedUsage(feature)
      },
      createdAt: new Date(),
      metadata: {
        userProficiency: this.getUserProficiencyLevel(),
        daysSinceRegistration: Math.floor((Date.now() - this.userUsage.registrationDate.getTime()) / (24 * 60 * 60 * 1000))
      }
    }
  }

  /**
   * Calculate confidence score for a feature recommendation
   */
  private calculateFeatureConfidence(
    feature: FeatureDefinition,
    reason: FeatureDiscoveryRecommendation['reason']
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Adjust based on reason
    switch (reason) {
      case 'unused_feature':
        confidence += 0.2
        break
      case 'related_feature':
        confidence += 0.3
        break
      case 'new_feature':
        confidence += 0.1
        break
      case 'upgrade_opportunity':
        confidence += 0.4
        break
      case 'workflow_optimization':
        confidence += 0.3
        break
    }
    
    // Adjust based on feature priority
    const priorityBonus = { critical: 0.3, high: 0.2, medium: 0.1, low: 0 }
    confidence += priorityBonus[feature.priority]
    
    // Adjust based on user preferences
    if (this.userUsage.preferences.preferredCategories.includes(feature.category)) {
      confidence += 0.1
    }
    
    // Adjust based on user proficiency
    const userProficiency = this.getUserProficiencyLevel()
    if (feature.minimumUsageLevel) {
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 }
      const userLevel = levelOrder[userProficiency]
      const requiredLevel = levelOrder[feature.minimumUsageLevel]
      
      if (userLevel >= requiredLevel) {
        confidence += 0.1
      } else {
        confidence -= 0.2
      }
    }
    
    // Adjust based on timing
    if (feature.suggestAfterDays) {
      const daysSinceRegistration = Math.floor(
        (Date.now() - this.userUsage.registrationDate.getTime()) / (24 * 60 * 60 * 1000)
      )
      
      if (daysSinceRegistration >= feature.suggestAfterDays) {
        confidence += 0.1
      } else {
        confidence -= 0.3
      }
    }
    
    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Generate messaging for feature recommendation
   */
  private generateFeatureMessaging(
    feature: FeatureDefinition,
    reason: FeatureDiscoveryRecommendation['reason']
  ): Pick<FeatureDiscoveryRecommendation, 'title' | 'message' | 'benefits'> {
    const reasonMessages = {
      unused_feature: {
        title: `Descubre: ${feature.name}`,
        message: `¿Sabías que puedes usar ${feature.name}? ${feature.introductionMessage}`,
        benefits: [feature.benefitsDescription, 'Mejora tu productividad', 'Fácil de usar']
      },
      related_feature: {
        title: `Complementa tu trabajo con ${feature.name}`,
        message: `Basado en tu uso actual, ${feature.name} podría ser muy útil. ${feature.introductionMessage}`,
        benefits: [feature.benefitsDescription, 'Se integra con tus herramientas actuales', 'Optimiza tu flujo de trabajo']
      },
      new_feature: {
        title: `¡Nuevo! ${feature.name}`,
        message: `Acabamos de lanzar ${feature.name}. ${feature.introductionMessage}`,
        benefits: [feature.benefitsDescription, 'Funcionalidad recién añadida', 'Mantente al día con las novedades']
      },
      upgrade_opportunity: {
        title: `Mejora tu experiencia con ${feature.name}`,
        message: `Lleva tu trabajo al siguiente nivel con ${feature.name}. ${feature.introductionMessage}`,
        benefits: [feature.benefitsDescription, 'Funcionalidades avanzadas', 'Mayor eficiencia']
      },
      workflow_optimization: {
        title: `Optimiza tu flujo con ${feature.name}`,
        message: `${feature.name} puede hacer tu trabajo más eficiente. ${feature.introductionMessage}`,
        benefits: [feature.benefitsDescription, 'Ahorra tiempo', 'Automatiza tareas repetitivas']
      }
    }
    
    return reasonMessages[reason]
  }

  /**
   * Get "What's New" items for user
   */
  public getWhatsNewItems(): WhatsNewItem[] {
    if (!this.config.enableWhatsNew) return []
    
    const now = Date.now()
    const retentionThreshold = now - (this.config.whatsNewRetentionDays * 24 * 60 * 60 * 1000)
    
    return Array.from(this.whatsNewItems.values())
      .filter(item => {
        // Check if item is still valid
        const isValid = item.publishDate.getTime() > retentionThreshold &&
                       (!item.expiryDate || item.expiryDate.getTime() > now)
        
        // Check if user has access
        const hasAccess = !item.targetRoles || item.targetRoles.includes(this.userUsage.currentRole)
        
        return isValid && hasAccess
      })
      .sort((a, b) => {
        // Sort by priority and recency
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority]
        const bPriority = priorityOrder[b.priority]
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority
        }
        
        return b.publishDate.getTime() - a.publishDate.getTime()
      })
      .slice(0, this.config.maxWhatsNewItems)
  }

  /**
   * Mark feature suggestion as dismissed
   */
  public dismissFeatureSuggestion(featureId: string, reason?: string): void {
    const existing = this.userUsage.suggestedFeatures.get(featureId)
    const now = new Date()
    
    if (existing) {
      existing.dismissed = true
      existing.dismissedReason = reason
    } else {
      this.userUsage.suggestedFeatures.set(featureId, {
        firstSuggested: now,
        lastSuggested: now,
        suggestionCount: 1,
        dismissed: true,
        dismissedReason: reason,
        accepted: false
      })
    }
  }

  /**
   * Mark feature suggestion as accepted
   */
  public acceptFeatureSuggestion(featureId: string): void {
    const existing = this.userUsage.suggestedFeatures.get(featureId)
    const now = new Date()
    
    if (existing) {
      existing.accepted = true
      existing.acceptedDate = now
    } else {
      this.userUsage.suggestedFeatures.set(featureId, {
        firstSuggested: now,
        lastSuggested: now,
        suggestionCount: 1,
        dismissed: false,
        accepted: true,
        acceptedDate: now
      })
    }
  }

  /**
   * Add new feature to discovery system
   */
  public addFeature(feature: FeatureDefinition): void {
    this.features.set(feature.id, feature)
  }

  /**
   * Add new "What's New" item
   */
  public addWhatsNewItem(item: WhatsNewItem): void {
    this.whatsNewItems.set(item.id, item)
  }

  /**
   * Get personalized tour recommendations
   */
  public getPersonalizedTourRecommendations(): string[] {
    const recommendations = this.generateRecommendations()
    return recommendations
      .filter(rec => rec.feature.tourId)
      .map(rec => rec.feature.tourId!)
      .slice(0, 3) // Limit to top 3
  }

  // Private helper methods

  private userHasAccess(feature: FeatureDefinition): boolean {
    // Check role requirements
    if (feature.requiredRole && !feature.requiredRole.includes(this.userUsage.currentRole)) {
      return false
    }
    
    // Check permission requirements
    if (feature.requiredPermissions) {
      const hasAllPermissions = feature.requiredPermissions.every(
        permission => this.userUsage.permissions.includes(permission)
      )
      if (!hasAllPermissions) return false
    }
    
    return true
  }

  private getUserProficiencyLevel(): 'beginner' | 'intermediate' | 'advanced' {
    const usageEntries = Array.from(this.userUsage.featureUsage.values())
    if (usageEntries.length === 0) return 'beginner'
    
    const totalUsage = usageEntries.reduce((sum, usage) => sum + usage.usageCount, 0)
    const averageUsage = totalUsage / usageEntries.length
    
    if (averageUsage >= 15) return 'advanced'
    if (averageUsage >= 5) return 'intermediate'
    return 'beginner'
  }

  private getRecentActivity(): string[] {
    // This would track recent user actions
    return ['page_view', 'feature_usage', 'content_creation']
  }

  private getRelatedUsage(feature: FeatureDefinition): string[] {
    return feature.relatedFeatures.filter(relatedId => 
      this.userUsage.featureUsage.has(relatedId)
    )
  }

  private calculateSuggestionDelay(
    feature: FeatureDefinition,
    reason: FeatureDiscoveryRecommendation['reason']
  ): number {
    const baseDelays = {
      unused_feature: 5000,
      related_feature: 3000,
      new_feature: 2000,
      upgrade_opportunity: 4000,
      workflow_optimization: 3000
    }
    
    const priorityMultipliers = { critical: 0.5, high: 0.7, medium: 1.0, low: 1.5 }
    
    return Math.floor(baseDelays[reason] * priorityMultipliers[feature.priority])
  }

  /**
   * Get discovery analytics
   */
  public getDiscoveryAnalytics(): Record<string, any> {
    return {
      totalFeatures: this.features.size,
      usedFeatures: this.userUsage.featureUsage.size,
      unusedFeatures: this.getUnusedFeatures().length,
      suggestedFeatures: this.userUsage.suggestedFeatures.size,
      whatsNewItems: this.whatsNewItems.size,
      userProficiency: this.getUserProficiencyLevel(),
      recommendationHistory: this.recommendationHistory.length
    }
  }
}