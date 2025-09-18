/**
 * Tour search and filtering utilities
 */

import type { TourDefinition } from '@/types/tour'

export interface TourSearchOptions {
  query?: string
  category?: string
  status?: string
  tags?: string[]
  minDuration?: number
  maxDuration?: number
}

export interface TourSortOptions {
  field: 'name' | 'duration' | 'category' | 'status' | 'lastUpdated'
  order: 'asc' | 'desc'
}

/**
 * Search tours based on various criteria
 */
export function searchTours(
  tours: TourDefinition[],
  options: TourSearchOptions = {},
  getTourStatus?: (tourId: string) => string
): TourDefinition[] {
  let filtered = [...tours]

  // Text search
  if (options.query?.trim()) {
    const query = options.query.toLowerCase()
    filtered = filtered.filter(tour =>
      tour.name.toLowerCase().includes(query) ||
      tour.description.toLowerCase().includes(query) ||
      tour.id.toLowerCase().includes(query) ||
      tour.category.toLowerCase().includes(query)
    )
  }

  // Category filter
  if (options.category) {
    filtered = filtered.filter(tour => tour.category === options.category)
  }

  // Status filter
  if (options.status && getTourStatus) {
    filtered = filtered.filter(tour => {
      const status = getTourStatus(tour.id)
      return status === options.status
    })
  }

  // Tags filter (if tours have tags in metadata)
  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(tour => {
      const tourTags = (tour.metadata as any).tags || []
      return options.tags!.some(tag => tourTags.includes(tag))
    })
  }

  // Duration filters
  if (options.minDuration !== undefined) {
    filtered = filtered.filter(tour => tour.metadata.estimatedDuration >= options.minDuration!)
  }

  if (options.maxDuration !== undefined) {
    filtered = filtered.filter(tour => tour.metadata.estimatedDuration <= options.maxDuration!)
  }

  return filtered
}

/**
 * Sort tours based on specified criteria
 */
export function sortTours(
  tours: TourDefinition[],
  options: TourSortOptions,
  getTourStatus?: (tourId: string) => string
): TourDefinition[] {
  const sorted = [...tours].sort((a, b) => {
    let comparison = 0

    switch (options.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'duration':
        comparison = a.metadata.estimatedDuration - b.metadata.estimatedDuration
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      case 'status':
        if (getTourStatus) {
          const statusA = getTourStatus(a.id)
          const statusB = getTourStatus(b.id)
          comparison = statusA.localeCompare(statusB)
        }
        break
      case 'lastUpdated':
        const dateA = new Date(a.metadata.lastUpdated)
        const dateB = new Date(b.metadata.lastUpdated)
        comparison = dateA.getTime() - dateB.getTime()
        break
    }

    return options.order === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * Get tour statistics for a collection of tours
 */
export function getTourStats(
  tours: TourDefinition[],
  getTourStatus?: (tourId: string) => string
) {
  const stats = {
    total: tours.length,
    byCategory: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    totalDuration: 0,
    averageDuration: 0,
    completionRate: 0
  }

  // Calculate category distribution
  tours.forEach(tour => {
    stats.byCategory[tour.category] = (stats.byCategory[tour.category] || 0) + 1
    stats.totalDuration += tour.metadata.estimatedDuration
  })

  // Calculate average duration
  stats.averageDuration = stats.total > 0 ? stats.totalDuration / stats.total : 0

  // Calculate status distribution and completion rate
  if (getTourStatus) {
    let completedCount = 0
    tours.forEach(tour => {
      const status = getTourStatus(tour.id)
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      if (status === 'completed') {
        completedCount++
      }
    })
    stats.completionRate = stats.total > 0 ? (completedCount / stats.total) * 100 : 0
  }

  return stats
}

/**
 * Get recommended tours based on user behavior and preferences
 */
export function getRecommendedTours(
  tours: TourDefinition[],
  userPreferences: {
    completedTours: string[]
    preferredCategories?: string[]
    skillLevel?: 'beginner' | 'intermediate' | 'advanced'
    timeAvailable?: number // in minutes
  }
): TourDefinition[] {
  // Filter out already completed tours
  let recommended = tours.filter(tour => 
    !userPreferences.completedTours.includes(tour.id)
  )

  // Prioritize preferred categories
  if (userPreferences.preferredCategories?.length) {
    const preferred = recommended.filter(tour => 
      userPreferences.preferredCategories!.includes(tour.category)
    )
    const others = recommended.filter(tour => 
      !userPreferences.preferredCategories!.includes(tour.category)
    )
    recommended = [...preferred, ...others]
  }

  // Filter by available time
  if (userPreferences.timeAvailable) {
    recommended = recommended.filter(tour => 
      tour.metadata.estimatedDuration <= userPreferences.timeAvailable!
    )
  }

  // Sort by relevance (onboarding first for beginners, features for others)
  recommended.sort((a, b) => {
    if (userPreferences.skillLevel === 'beginner') {
      if (a.category === 'onboarding' && b.category !== 'onboarding') return -1
      if (b.category === 'onboarding' && a.category !== 'onboarding') return 1
    }
    
    // Then by estimated duration (shorter first)
    return a.metadata.estimatedDuration - b.metadata.estimatedDuration
  })

  return recommended.slice(0, 5) // Return top 5 recommendations
}

/**
 * Create search suggestions based on tour content
 */
export function getSearchSuggestions(
  tours: TourDefinition[],
  query: string,
  maxSuggestions = 5
): string[] {
  if (!query.trim()) return []

  const suggestions = new Set<string>()
  const queryLower = query.toLowerCase()

  tours.forEach(tour => {
    // Add tour names that match
    if (tour.name.toLowerCase().includes(queryLower)) {
      suggestions.add(tour.name)
    }

    // Add categories that match
    if (tour.category.toLowerCase().includes(queryLower)) {
      suggestions.add(tour.category.replace('_', ' '))
    }

    // Add words from descriptions that start with query
    const words = tour.description.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.startsWith(queryLower) && word.length > query.length) {
        suggestions.add(word)
      }
    })
  })

  return Array.from(suggestions).slice(0, maxSuggestions)
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Get tour categories with counts
 */
export function getTourCategoriesWithCounts(
  tours: TourDefinition[]
): Array<{ category: string; count: number; label: string }> {
  const counts = tours.reduce((acc, tour) => {
    acc[tour.category] = (acc[tour.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryLabels = {
    'onboarding': 'Getting Started',
    'feature': 'Features',
    'contextual': 'Contextual Help',
    'help': 'Help & Support'
  }

  return Object.entries(counts).map(([category, count]) => ({
    category,
    count,
    label: categoryLabels[category as keyof typeof categoryLabels] || category
  }))
}