'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle,
  Search,
  Play,
  Clock,
  Users,
  Zap,
  BookOpen,
  Filter,
  X,
  ChevronRight,
  Star,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTour } from '@/hooks/use-tour'
import { useTourProgress } from '@/hooks/use-tour-progress'
import { getTourRegistry, TOUR_CATEGORIES } from '@/lib/tour/tour-registry'
import type { TourDefinition } from '@/types/tour'

interface TourHelpMenuProps {
  className?: string
}

interface TourCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const tourCategories: TourCategory[] = [
  {
    id: TOUR_CATEGORIES.ONBOARDING,
    name: 'Getting Started',
    description: 'Essential tours for new users',
    icon: Users,
    color: 'bg-info-500'
  },
  {
    id: TOUR_CATEGORIES.FEATURE,
    name: 'Features',
    description: 'Learn specific functionality',
    icon: Zap,
    color: 'bg-success-500'
  },
  {
    id: TOUR_CATEGORIES.CONTEXTUAL,
    name: 'Contextual Help',
    description: 'Page-specific guidance',
    icon: BookOpen,
    color: 'bg-purple-500'
  },
  {
    id: TOUR_CATEGORIES.HELP,
    name: 'Help & Support',
    description: 'Troubleshooting and tips',
    icon: HelpCircle,
    color: 'bg-orange-500'
  }
]

export default function TourHelpMenu({ className }: TourHelpMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [availableTours, setAvailableTours] = useState<TourDefinition[]>([])
  const [filteredTours, setFilteredTours] = useState<TourDefinition[]>([])
  const [loading, setLoading] = useState(false)

  const { startTour } = useTour()
  const { getTourProgress } = useTourProgress()

  // Load available tours
  useEffect(() => {
    const loadTours = async () => {
      setLoading(true)
      try {
        const registry = getTourRegistry()
        const tourIds = registry.getAvailableTours()
        const tours: TourDefinition[] = []

        for (const tourId of tourIds) {
          try {
            const tour = await registry.loadTour(tourId)
            tours.push(tour)
          } catch (error) {
            console.warn(`Failed to load tour ${tourId}:`, error)
          }
        }

        setAvailableTours(tours)
        setFilteredTours(tours)
      } catch (error) {
        console.error('Failed to load tours:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadTours()
    }
  }, [isOpen])

  // Filter tours based on search and category
  useEffect(() => {
    let filtered = availableTours

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(tour => tour.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tour =>
        tour.name.toLowerCase().includes(query) ||
        tour.description.toLowerCase().includes(query) ||
        tour.id.toLowerCase().includes(query)
      )
    }

    setFilteredTours(filtered)
  }, [availableTours, searchQuery, selectedCategory])

  const handleStartTour = (tourId: string) => {
    startTour(tourId)
    setIsOpen(false)
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
      default:
        return null
    }
  }

  return (
    <>
      {/* Help Menu Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => <span>setIsOpen(true)}
        className={cn(
          "h-9 w-9 p-0 hover:bg-muted/50 transition-colors",
          className
        )}
        aria-label="Open tour help menu"
      ></span><HelpCircle className="h-4 w-4" />
      </Button>

      {/* Help Menu Modal */}
      <AnimatePresence> <span>{isOpen && (</span><>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-4xl h-[80vh] bg-background border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Tour Library
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discover guided tours to help you master Postia
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => <span>setIsOpen(false)}
                  className="h-8 w-8 p-0"
                ></span><X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex h-[calc(100%-80px)]">
                {/* Sidebar - Categories */}
                <div className="w-64 border-r border-border p-4 overflow-y-auto">
                  <div className="space-y-2">
                    <Button
                      variant={selectedCategory === null ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => <span>setSelectedCategory(null)}
                    ></span><div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                          <Star className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">All Tours</p>
                          <p className="text-xs text-muted-foreground">
                            {availableTours.length} available
                          </p>
                        </div>
                      </div>
                    </Button>

                    <Separator className="my-3" /> <span>{tourCategories.map((category) => {
                      const categoryTours = availableTours.filter(tour => tour.category === category.id)
                      const completedCount = categoryTours.filter(tour => 
                        getTourStatus(tour.id) === 'completed'
                      ).length

                      return (</span><Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto p-3"
                          onClick={() => <span>setSelectedCategory(category.id)}
                        ></span><div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              category.color
                            )}>
                              <category.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {completedCount}/{categoryTours.length} completed
                              </p>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tours..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      {selectedCategory && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => <span>setSelectedCategory(null)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        ></span><X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tours List */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">Loading tours...</div>
                      </div>
                    ) : filteredTours.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {searchQuery || selectedCategory ? 'No tours match your criteria' : 'No tours available'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {filteredTours.map((tour) => {
                          const status = getTourStatus(tour.id)
                          const category = tourCategories.find(cat => cat.id === tour.category)
                          
                          return (
                            <Card key={tour.id} className="p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {category && (
                                    <div className={cn(
                                      "w-6 h-6 rounded flex items-center justify-center",
                                      category.color
                                    )}>
                                      <category.icon className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <h3 className="font-medium text-foreground">{tour.name}</h3>
                                </div>
                                {getStatusBadge(status)}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
                                  onClick={() => <span>handleStartTour(tour.id)}
                                  className="h-8"
                                >
                                  {status === 'completed' ? 'Replay' : status === 'in_progress' ? 'Continue' : 'Start'}</span><ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}