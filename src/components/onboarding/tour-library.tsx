'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Play,
  Clock,
  CheckCircle,
  Star,
  BookOpen,
  Users,
  Zap,
  HelpCircle,
  ChevronDown,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTour } from '@/hooks/use-tour'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry, TOUR_CATEGORIES } from '@/lib/tour/tour-registry'
import type { TourDefinition } from '@/types/tour'

interface TourLibraryProps {
  className?: string
  onTourStart?: (tourId: string) => void
}

type SortOption = 'name' | 'duration' | 'category' | 'status'
type ViewMode = 'grid' | 'list'

interface FilterOptions {
  category: string | null
  status: string | null
  search: string
}

const categoryIcons = {
  [TOUR_CATEGORIES.ONBOARDING]: Users,
  [TOUR_CATEGORIES.FEATURE]: Zap,
  [TOUR_CATEGORIES.CONTEXTUAL]: BookOpen,
  [TOUR_CATEGORIES.HELP]: HelpCircle,
}

const categoryColors = {
  [TOUR_CATEGORIES.ONBOARDING]: 'bg-info-500',
  [TOUR_CATEGORIES.FEATURE]: 'bg-success-500',
  [TOUR_CATEGORIES.CONTEXTUAL]: 'bg-purple-500',
  [TOUR_CATEGORIES.HELP]: 'bg-orange-500',
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
]

export default function TourLibrary({ className, onTourStart }: TourLibraryProps) {
  const [tours, setTours] = useState<TourDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<FilterOptions>({
    category: null,
    status: null,
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  const { startTour } = useTour()
  const { loadProgress, progressData } = useTourProgress()

  // Helper function to get tour progress
  const getTourProgress = (tourId: string) => {
    return progressData.find(progress => progress.tourId === tourId)
  }

  // Load tours
  useEffect(() => {
    const loadTours = async () => {
      setLoading(true)
      try {
        const registry = getTourRegistry()
        const tourIds = registry.getAvailableTours()
        const loadedTours: TourDefinition[] = []

        for (const tourId of tourIds) {
          try {
            const tour = await registry.loadTour(tourId)
            loadedTours.push(tour)
          } catch (error) {
            console.warn(`Failed to load tour ${tourId}:`, error)
          }
        }

        setTours(loadedTours)
      } catch (error) {
        console.error('Failed to load tours:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTours()
  }, [])

  // Filter and sort tours
  const filteredAndSortedTours = useMemo(() => {
    let filtered = tours

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(tour => tour.category === filters.category)
    }

    if (filters.status) {
      filtered = filtered.filter(tour => {
        const progress = getTourProgress(tour.id)
        return (progress?.status || 'not_started') === filters.status
      })
    }

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(tour =>
        tour.name.toLowerCase().includes(query) ||
        tour.description.toLowerCase().includes(query) ||
        tour.id.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
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
          const statusA = getTourProgress(a.id)?.status || 'not_started'
          const statusB = getTourProgress(b.id)?.status || 'not_started'
          comparison = statusA.localeCompare(statusB)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [tours, filters, sortBy, sortOrder, getTourProgress])

  const handleTourStart = (tourId: string) => {
    startTour(tourId)
    onTourStart?.(tourId)
  }

  const getTourStatus = (tourId: string) => {
    const progress = getTourProgress(tourId)
    return progress?.status || 'not_started'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'in_progress':
        return <Play className="w-4 h-4 text-info-600" />
      default:
        return <Play className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-success-700 bg-success-100">Completed</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="text-info-700 bg-info-100">In Progress</Badge>
      case 'skipped':
        return <Badge variant="secondary" className="text-gray-700 bg-gray-100">Skipped</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const clearFilters = () => {
    setFilters({
      category: null,
      status: null,
      search: ''
    })
  }

  const hasActiveFilters = filters.category || filters.status || filters.search.trim()

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-muted-foreground">Loading tour library...</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Tour Library</h2>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedTours.length} of {tours.length} tours
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid className="w-3 h-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 w-7 p-0"
            >
              <List className="w-3 h-3" />
            </Button>
          </div>

          {/* Sort Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-8"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
          </Button>

          {/* Filters Toggle */}
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border border-border rounded-lg p-4 bg-muted/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tours..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || null }))}
                aria-label="Filter tours by category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Categories</option>
                <option value={TOUR_CATEGORIES.ONBOARDING}>Getting Started</option>
                <option value={TOUR_CATEGORIES.FEATURE}>Features</option>
                <option value={TOUR_CATEGORIES.CONTEXTUAL}>Contextual Help</option>
                <option value={TOUR_CATEGORIES.HELP}>Help & Support</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || null }))}
                aria-label="Filter tours by completion status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort tours by criteria"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="name">Sort by Name</option>
                <option value="duration">Sort by Duration</option>
                <option value="category">Sort by Category</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Active filters:</span>
                  {filters.category && <Badge variant="outline">Category: {filters.category}</Badge>}
                  {filters.status && <Badge variant="outline">Status: {filters.status}</Badge>}
                  {filters.search && <Badge variant="outline">Search: "{filters.search}"</Badge>}
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tours Display */}
      {filteredAndSortedTours.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tours found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'Try adjusting your filters to see more tours'
              : 'No tours are currently available'
            }
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        )}>
          {filteredAndSortedTours.map((tour) => {
            const status = getTourStatus(tour.id)
            const CategoryIcon = categoryIcons[tour.category as keyof typeof categoryIcons]
            const categoryColor = categoryColors[tour.category as keyof typeof categoryColors]

            return viewMode === 'grid' ? (
              <Card key={tour.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {CategoryIcon && (
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        categoryColor
                      )}>
                        <CategoryIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{tour.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {tour.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {tour.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(tour.metadata.estimatedDuration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleTourStart(tour.id)}
                  >
                    {status === 'completed' ? 'Replay' : status === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card key={tour.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {CategoryIcon && (
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        categoryColor
                      )}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">{tour.name}</h3>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="capitalize">{tour.category.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(tour.metadata.estimatedDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(status)}
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleTourStart(tour.id)}
                    className="ml-4 flex-shrink-0"
                  >
                    {status === 'completed' ? 'Replay' : status === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}