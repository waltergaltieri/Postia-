/**
 * Optimization strategies for large tour configurations
 * Implements various techniques to improve performance with complex tours
 */

import type { TourDefinition, TourStep } from '@/types/tour'
import { getTourMemoryManager } from './tour-memory-manager'
import { getTourPerformanceMonitor } from './tour-performance-monitor'

interface OptimizationConfig {
  enableStepVirtualization: boolean
  enableContentCompression: boolean
  enableLazyStepLoading: boolean
  enableImageOptimization: boolean
  enableDOMOptimization: boolean
  maxStepsPerChunk: number
  compressionThreshold: number // in characters
}

interface OptimizedTour {
  tour: TourDefinition
  optimizations: string[]
  originalSize: number
  optimizedSize: number
  performanceGain: number
}

interface StepChunk {
  id: string
  steps: TourStep[]
  startIndex: number
  endIndex: number
  isLoaded: boolean
  loadPromise?: Promise<TourStep[]>
}

/**
 * Tour optimization engine for large and complex tours
 */
export class TourOptimizationEngine {
  private static instance: TourOptimizationEngine
  private config: OptimizationConfig
  private optimizedTours = new Map<string, OptimizedTour>()
  private stepChunks = new Map<string, StepChunk[]>()
  private imageCache = new Map<string, string>()

  private constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableStepVirtualization: true,
      enableContentCompression: true,
      enableLazyStepLoading: true,
      enableImageOptimization: true,
      enableDOMOptimization: true,
      maxStepsPerChunk: 5,
      compressionThreshold: 1000,
      ...config
    }
  }

  static getInstance(config?: Partial<OptimizationConfig>): TourOptimizationEngine {
    if (!TourOptimizationEngine.instance) {
      TourOptimizationEngine.instance = new TourOptimizationEngine(config)
    }
    return TourOptimizationEngine.instance
  }

  /**
   * Optimize a tour configuration for better performance
   */
  async optimizeTour(tour: TourDefinition): Promise<OptimizedTour> {
    const startTime = performance.now()
    const originalSize = this.calculateTourSize(tour)
    const optimizations: string[] = []

    let optimizedTour = { ...tour }

    // Apply various optimization strategies
    if (this.config.enableStepVirtualization && tour.steps.length > 10) {
      optimizedTour = await this.applyStepVirtualization(optimizedTour)
      optimizations.push('Step Virtualization')
    }

    if (this.config.enableContentCompression) {
      optimizedTour = await this.applyContentCompression(optimizedTour)
      optimizations.push('Content Compression')
    }

    if (this.config.enableLazyStepLoading && tour.steps.length > this.config.maxStepsPerChunk) {
      optimizedTour = await this.applyLazyStepLoading(optimizedTour)
      optimizations.push('Lazy Step Loading')
    }

    if (this.config.enableImageOptimization) {
      optimizedTour = await this.applyImageOptimization(optimizedTour)
      optimizations.push('Image Optimization')
    }

    if (this.config.enableDOMOptimization) {
      optimizedTour = await this.applyDOMOptimization(optimizedTour)
      optimizations.push('DOM Optimization')
    }

    const optimizedSize = this.calculateTourSize(optimizedTour)
    const performanceGain = ((originalSize - optimizedSize) / originalSize) * 100

    const result: OptimizedTour = {
      tour: optimizedTour,
      optimizations,
      originalSize,
      optimizedSize,
      performanceGain
    }

    // Cache the optimized tour
    this.optimizedTours.set(tour.id, result)

    const optimizationTime = performance.now() - startTime
    console.log(`Tour ${tour.id} optimized in ${optimizationTime.toFixed(2)}ms`, {
      originalSize: `${(originalSize / 1024).toFixed(2)}KB`,
      optimizedSize: `${(optimizedSize / 1024).toFixed(2)}KB`,
      performanceGain: `${performanceGain.toFixed(2)}%`,
      optimizations
    })

    return result
  }

  /**
   * Get optimized tour if available, otherwise optimize and return
   */
  async getOptimizedTour(tour: TourDefinition): Promise<OptimizedTour> {
    const cached = this.optimizedTours.get(tour.id)
    if (cached) {
      return cached
    }

    return this.optimizeTour(tour)
  }

  /**
   * Load tour steps in chunks for large tours
   */
  async loadTourStepsChunk(tourId: string, chunkIndex: number): Promise<TourStep[]> {
    const chunks = this.stepChunks.get(tourId)
    if (!chunks || chunkIndex >= chunks.length) {
      throw new Error(`Invalid chunk index ${chunkIndex} for tour ${tourId}`)
    }

    const chunk = chunks[chunkIndex]
    if (chunk.isLoaded) {
      return chunk.steps
    }

    if (chunk.loadPromise) {
      return chunk.loadPromise
    }

    // Start loading the chunk
    chunk.loadPromise = this.loadChunkSteps(chunk)
    const steps = await chunk.loadPromise
    
    chunk.steps = steps
    chunk.isLoaded = true
    delete chunk.loadPromise

    return steps
  }

  /**
   * Preload next chunk for smoother experience
   */
  async preloadNextChunk(tourId: string, currentChunkIndex: number): Promise<void> {
    const chunks = this.stepChunks.get(tourId)
    if (!chunks) return

    const nextChunkIndex = currentChunkIndex + 1
    if (nextChunkIndex < chunks.length) {
      try {
        await this.loadTourStepsChunk(tourId, nextChunkIndex)
      } catch (error) {
        console.warn(`Failed to preload chunk ${nextChunkIndex}:`, error)
      }
    }
  }

  /**
   * Get optimization recommendations for a tour
   */
  getOptimizationRecommendations(tour: TourDefinition): {
    recommendations: string[]
    estimatedGains: Record<string, number>
    priority: 'high' | 'medium' | 'low'
  } {
    const recommendations: string[] = []
    const estimatedGains: Record<string, number> = {}
    let priority: 'high' | 'medium' | 'low' = 'low'

    const tourSize = this.calculateTourSize(tour)
    const stepCount = tour.steps.length

    // Large tour recommendations
    if (stepCount > 20) {
      recommendations.push('Enable step virtualization for large tours')
      estimatedGains['Step Virtualization'] = 30
      priority = 'high'
    }

    if (stepCount > 10) {
      recommendations.push('Implement lazy step loading')
      estimatedGains['Lazy Step Loading'] = 20
      if (priority === 'low') priority = 'medium'
    }

    // Content size recommendations
    if (tourSize > 50 * 1024) { // 50KB
      recommendations.push('Enable content compression')
      estimatedGains['Content Compression'] = 25
      priority = 'high'
    }

    // Image optimization recommendations
    const hasImages = tour.steps.some(step => 
      step.description.includes('<img') || step.description.includes('![')
    )
    if (hasImages) {
      recommendations.push('Optimize images in tour content')
      estimatedGains['Image Optimization'] = 40
      if (priority !== 'high') priority = 'medium'
    }

    // DOM complexity recommendations
    const complexSelectors = tour.steps.filter(step => 
      typeof step.element === 'string' && 
      (step.element.includes(' ') || step.element.includes('>') || step.element.includes('+'))
    ).length

    if (complexSelectors > stepCount * 0.5) {
      recommendations.push('Simplify DOM selectors for better performance')
      estimatedGains['DOM Optimization'] = 15
    }

    return {
      recommendations,
      estimatedGains,
      priority
    }
  }

  /**
   * Batch optimize multiple tours
   */
  async batchOptimizeTours(tours: TourDefinition[]): Promise<Map<string, OptimizedTour>> {
    const results = new Map<string, OptimizedTour>()
    
    // Sort tours by size (optimize largest first)
    const sortedTours = tours.sort((a, b) => 
      this.calculateTourSize(b) - this.calculateTourSize(a)
    )

    // Process in batches to avoid overwhelming the system
    const batchSize = 3
    for (let i = 0; i < sortedTours.length; i += batchSize) {
      const batch = sortedTours.slice(i, i + batchSize)
      
      const batchPromises = batch.map(tour => this.optimizeTour(tour))
      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        results.set(result.tour.id, result)
      })
    }

    return results
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizedTours.clear()
    this.stepChunks.clear()
    this.imageCache.clear()
  }

  /**
   * Private optimization methods
   */
  private async applyStepVirtualization(tour: TourDefinition): Promise<TourDefinition> {
    // Create virtual steps that load content on demand
    const virtualizedSteps: TourStep[] = tour.steps.map((step, index) => ({
      ...step,
      // Add virtualization metadata
      metadata: {
        ...step.metadata,
        isVirtualized: true,
        originalIndex: index
      }
    }))

    // Create step chunks for lazy loading
    const chunks: StepChunk[] = []
    for (let i = 0; i < virtualizedSteps.length; i += this.config.maxStepsPerChunk) {
      const chunkSteps = virtualizedSteps.slice(i, i + this.config.maxStepsPerChunk)
      chunks.push({
        id: `${tour.id}-chunk-${Math.floor(i / this.config.maxStepsPerChunk)}`,
        steps: chunkSteps,
        startIndex: i,
        endIndex: Math.min(i + this.config.maxStepsPerChunk - 1, virtualizedSteps.length - 1),
        isLoaded: i === 0 // Load first chunk immediately
      })
    }

    this.stepChunks.set(tour.id, chunks)

    return {
      ...tour,
      steps: chunks[0].steps, // Start with first chunk
      metadata: {
        ...tour.metadata,
        isVirtualized: true,
        totalChunks: chunks.length,
        stepsPerChunk: this.config.maxStepsPerChunk
      }
    }
  }

  private async applyContentCompression(tour: TourDefinition): Promise<TourDefinition> {
    const compressedSteps = tour.steps.map(step => {
      let compressedDescription = step.description
      let compressedTitle = step.title

      // Compress long text content
      if (step.description.length > this.config.compressionThreshold) {
        compressedDescription = this.compressText(step.description)
      }

      if (step.title.length > 100) {
        compressedTitle = this.compressText(step.title)
      }

      return {
        ...step,
        title: compressedTitle,
        description: compressedDescription
      }
    })

    return {
      ...tour,
      steps: compressedSteps,
      description: tour.description.length > this.config.compressionThreshold 
        ? this.compressText(tour.description)
        : tour.description
    }
  }

  private async applyLazyStepLoading(tour: TourDefinition): Promise<TourDefinition> {
    // Create lazy-loaded step placeholders
    const lazySteps: TourStep[] = tour.steps.map((step, index) => {
      if (index < this.config.maxStepsPerChunk) {
        // Keep first chunk loaded
        return step
      }

      // Create placeholder for lazy-loaded steps
      return {
        element: step.element,
        title: step.title,
        description: 'Loading...', // Placeholder content
        position: step.position,
        metadata: {
          ...step.metadata,
          isLazyLoaded: true,
          originalStep: step // Store original for later loading
        }
      }
    })

    return {
      ...tour,
      steps: lazySteps
    }
  }

  private async applyImageOptimization(tour: TourDefinition): Promise<TourDefinition> {
    const optimizedSteps = await Promise.all(
      tour.steps.map(async (step) => {
        let optimizedDescription = step.description

        // Find and optimize images in step descriptions
        const imageRegex = /<img[^>]+src="([^"]+)"[^>]*>/g
        const matches = [...step.description.matchAll(imageRegex)]

        for (const match of matches) {
          const originalSrc = match[1]
          const optimizedSrc = await this.optimizeImage(originalSrc)
          optimizedDescription = optimizedDescription.replace(originalSrc, optimizedSrc)
        }

        return {
          ...step,
          description: optimizedDescription
        }
      })
    )

    return {
      ...tour,
      steps: optimizedSteps
    }
  }

  private async applyDOMOptimization(tour: TourDefinition): Promise<TourDefinition> {
    const optimizedSteps = tour.steps.map(step => {
      let optimizedElement = step.element

      if (typeof step.element === 'string') {
        // Optimize CSS selectors
        optimizedElement = this.optimizeSelector(step.element)
      }

      return {
        ...step,
        element: optimizedElement
      }
    })

    return {
      ...tour,
      steps: optimizedSteps
    }
  }

  private calculateTourSize(tour: TourDefinition): number {
    return new Blob([JSON.stringify(tour)]).size
  }

  private compressText(text: string): string {
    // Simple text compression - remove extra whitespace and optimize content
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()
  }

  private async optimizeImage(src: string): Promise<string> {
    // Check cache first
    const cached = this.imageCache.get(src)
    if (cached) {
      return cached
    }

    try {
      // In a real implementation, you might:
      // 1. Convert to WebP format
      // 2. Resize images
      // 3. Compress images
      // 4. Use CDN URLs
      
      // For now, just add loading optimization parameters
      const url = new URL(src, window.location.origin)
      url.searchParams.set('format', 'webp')
      url.searchParams.set('quality', '80')
      url.searchParams.set('width', '400')

      const optimizedSrc = url.toString()
      this.imageCache.set(src, optimizedSrc)
      
      return optimizedSrc
    } catch (error) {
      console.warn(`Failed to optimize image ${src}:`, error)
      return src
    }
  }

  private optimizeSelector(selector: string): string {
    // Optimize CSS selectors for better performance
    
    // Convert descendant selectors to child selectors where possible
    let optimized = selector.replace(/\s+/g, ' > ')
    
    // Use more specific selectors
    if (optimized.includes('[data-testid=')) {
      // data-testid selectors are already optimized
      return selector
    }
    
    // Add performance hints
    if (!optimized.startsWith('#') && !optimized.startsWith('[data-')) {
      // Suggest using ID or data attributes for better performance
      console.warn(`Consider using ID or data-testid for selector: ${selector}`)
    }
    
    return selector // Return original for safety
  }

  private async loadChunkSteps(chunk: StepChunk): Promise<TourStep[]> {
    // Simulate async loading of step chunk
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(chunk.steps)
      }, 100) // Small delay to simulate loading
    })
  }
}

/**
 * Tour performance analyzer for identifying optimization opportunities
 */
export class TourPerformanceAnalyzer {
  private static instance: TourPerformanceAnalyzer

  static getInstance(): TourPerformanceAnalyzer {
    if (!TourPerformanceAnalyzer.instance) {
      TourPerformanceAnalyzer.instance = new TourPerformanceAnalyzer()
    }
    return TourPerformanceAnalyzer.instance
  }

  /**
   * Analyze tour performance and identify bottlenecks
   */
  analyzeTourPerformance(tour: TourDefinition): {
    score: number
    bottlenecks: string[]
    optimizations: string[]
    metrics: {
      size: number
      complexity: number
      stepCount: number
      averageStepSize: number
    }
  } {
    const metrics = this.calculateTourMetrics(tour)
    const bottlenecks = this.identifyBottlenecks(tour, metrics)
    const optimizations = this.suggestOptimizations(bottlenecks, metrics)
    const score = this.calculatePerformanceScore(metrics, bottlenecks)

    return {
      score,
      bottlenecks,
      optimizations,
      metrics
    }
  }

  /**
   * Compare performance of multiple tours
   */
  compareTourPerformance(tours: TourDefinition[]): {
    rankings: Array<{ tourId: string; score: number; rank: number }>
    averageScore: number
    recommendations: string[]
  } {
    const analyses = tours.map(tour => ({
      tourId: tour.id,
      ...this.analyzeTourPerformance(tour)
    }))

    const rankings = analyses
      .map(analysis => ({ tourId: analysis.tourId, score: analysis.score, rank: 0 }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    const averageScore = analyses.reduce((sum, analysis) => sum + analysis.score, 0) / analyses.length

    const recommendations = this.generateGlobalRecommendations(analyses)

    return {
      rankings,
      averageScore,
      recommendations
    }
  }

  private calculateTourMetrics(tour: TourDefinition) {
    const size = new Blob([JSON.stringify(tour)]).size
    const stepCount = tour.steps.length
    const averageStepSize = size / stepCount
    
    // Calculate complexity based on various factors
    let complexity = 0
    complexity += stepCount * 0.1 // Base complexity from step count
    complexity += tour.steps.filter(step => typeof step.element === 'string' && step.element.includes(' ')).length * 0.2 // Complex selectors
    complexity += tour.steps.filter(step => step.description.length > 200).length * 0.1 // Long descriptions
    complexity += (tour.conditions?.length || 0) * 0.3 // Conditional logic
    complexity += tour.triggers.length * 0.1 // Multiple triggers

    return {
      size,
      complexity,
      stepCount,
      averageStepSize
    }
  }

  private identifyBottlenecks(tour: TourDefinition, metrics: ReturnType<TourPerformanceAnalyzer['calculateTourMetrics']>): string[] {
    const bottlenecks: string[] = []

    if (metrics.size > 100 * 1024) { // 100KB
      bottlenecks.push('Large tour size')
    }

    if (metrics.stepCount > 15) {
      bottlenecks.push('Too many steps')
    }

    if (metrics.complexity > 5) {
      bottlenecks.push('High tour complexity')
    }

    if (metrics.averageStepSize > 5 * 1024) { // 5KB per step
      bottlenecks.push('Large step content')
    }

    // Check for specific performance issues
    const hasComplexSelectors = tour.steps.some(step => 
      typeof step.element === 'string' && 
      (step.element.split(' ').length > 3 || step.element.includes('nth-child'))
    )
    if (hasComplexSelectors) {
      bottlenecks.push('Complex CSS selectors')
    }

    const hasLargeImages = tour.steps.some(step => 
      step.description.includes('<img') && !step.description.includes('width=')
    )
    if (hasLargeImages) {
      bottlenecks.push('Unoptimized images')
    }

    return bottlenecks
  }

  private suggestOptimizations(bottlenecks: string[], metrics: ReturnType<TourPerformanceAnalyzer['calculateTourMetrics']>): string[] {
    const optimizations: string[] = []

    if (bottlenecks.includes('Large tour size')) {
      optimizations.push('Enable content compression')
    }

    if (bottlenecks.includes('Too many steps')) {
      optimizations.push('Implement step virtualization')
      optimizations.push('Consider splitting into multiple tours')
    }

    if (bottlenecks.includes('High tour complexity')) {
      optimizations.push('Simplify tour logic and conditions')
    }

    if (bottlenecks.includes('Large step content')) {
      optimizations.push('Implement lazy step loading')
    }

    if (bottlenecks.includes('Complex CSS selectors')) {
      optimizations.push('Optimize DOM selectors')
    }

    if (bottlenecks.includes('Unoptimized images')) {
      optimizations.push('Enable image optimization')
    }

    return optimizations
  }

  private calculatePerformanceScore(
    metrics: ReturnType<TourPerformanceAnalyzer['calculateTourMetrics']>,
    bottlenecks: string[]
  ): number {
    let score = 100

    // Deduct points for bottlenecks
    score -= bottlenecks.length * 10

    // Deduct points for size
    if (metrics.size > 50 * 1024) score -= 20
    else if (metrics.size > 25 * 1024) score -= 10

    // Deduct points for complexity
    if (metrics.complexity > 5) score -= 15
    else if (metrics.complexity > 3) score -= 10

    // Deduct points for step count
    if (metrics.stepCount > 20) score -= 20
    else if (metrics.stepCount > 10) score -= 10

    return Math.max(0, score)
  }

  private generateGlobalRecommendations(analyses: Array<{ tourId: string; bottlenecks: string[]; optimizations: string[] }>): string[] {
    const allBottlenecks = analyses.flatMap(analysis => analysis.bottlenecks)
    const allOptimizations = analyses.flatMap(analysis => analysis.optimizations)

    // Count frequency of bottlenecks and optimizations
    const bottleneckCounts = allBottlenecks.reduce((counts, bottleneck) => {
      counts[bottleneck] = (counts[bottleneck] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const optimizationCounts = allOptimizations.reduce((counts, optimization) => {
      counts[optimization] = (counts[optimization] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    // Generate recommendations based on most common issues
    const recommendations: string[] = []
    
    const sortedBottlenecks = Object.entries(bottleneckCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    sortedBottlenecks.forEach(([bottleneck, count]) => {
      if (count > analyses.length * 0.3) { // If more than 30% of tours have this issue
        recommendations.push(`Address common issue: ${bottleneck} (affects ${count} tours)`)
      }
    })

    const sortedOptimizations = Object.entries(optimizationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    sortedOptimizations.forEach(([optimization, count]) => {
      if (count > analyses.length * 0.3) {
        recommendations.push(`Implement: ${optimization} (recommended for ${count} tours)`)
      }
    })

    return recommendations
  }
}

/**
 * Convenience functions
 */
export function getTourOptimizationEngine(config?: Partial<OptimizationConfig>): TourOptimizationEngine {
  return TourOptimizationEngine.getInstance(config)
}

export function getTourPerformanceAnalyzer(): TourPerformanceAnalyzer {
  return TourPerformanceAnalyzer.getInstance()
}

export async function optimizeTourConfiguration(tour: TourDefinition): Promise<OptimizedTour> {
  const engine = getTourOptimizationEngine()
  return engine.optimizeTour(tour)
}

export function analyzeTourPerformance(tour: TourDefinition) {
  const analyzer = getTourPerformanceAnalyzer()
  return analyzer.analyzeTourPerformance(tour)
}

export async function batchOptimizeTours(tours: TourDefinition[]): Promise<Map<string, OptimizedTour>> {
  const engine = getTourOptimizationEngine()
  return engine.batchOptimizeTours(tours)
}