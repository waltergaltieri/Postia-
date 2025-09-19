"use client"

import * as React from "react"
import { Search, Filter, Grid3X3, List, MoreHorizontal, ChevronDown, Grid2X2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContentCard, type ContentCardProps } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BulkSelectionSystem, type BulkAction } from "./bulk-selection-system"
import { useMobile, useScreenSize } from "@/hooks/use-mobile"
import SwipeActions, { commonSwipeActions } from "@/components/mobile/swipe-actions"
import TouchFeedback from "@/components/mobile/touch-feedback"
import { useLazyLoading } from "@/hooks/use-lazy-loading"

// Types for content grid
export interface ContentItem extends Omit<ContentCardProps, 'onSelect'> {
  id: string
  tags?: string[]
  clientId?: string
  campaignId?: string
}

export interface ContentGridFilters {
  search: string
  status: string[]
  contentType: string[]
  platform: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
}

export interface ContentGridProps {
  items: ContentItem[]
  loading?: boolean
  layout?: 'masonry' | 'grid' | 'list'
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onItemAction?: (itemId: string, action: string) => void
  onBulkAction?: (actionId: string, selectedIds: string[]) => void
  bulkActions?: BulkAction[]
  filters?: ContentGridFilters
  onFiltersChange?: (filters: ContentGridFilters) => void
  enableBulkSelection?: boolean
  showKeyboardShortcuts?: boolean
  className?: string
}

// Filter options
const statusOptions = [
  { value: 'draft', label: 'Borrador', color: 'bg-status-draft/10 text-status-draft' },
  { value: 'pending', label: 'Pendiente', color: 'bg-status-pending/10 text-status-pending' },
  { value: 'approved', label: 'Aprobado', color: 'bg-status-approved/10 text-status-approved' },
  { value: 'published', label: 'Publicado', color: 'bg-status-published/10 text-status-published' },
  { value: 'error', label: 'Error', color: 'bg-status-error/10 text-status-error' }
]

const contentTypeOptions = [
  { value: 'image', label: 'Imagen' },
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Texto' },
  { value: 'carousel', label: 'Carrusel' }
]

const platformOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' }
]

// Responsive masonry layout hook
function useMasonryLayout(items: ContentItem[], screenSize: 'mobile' | 'tablet' | 'desktop') {
  const [columnHeights, setColumnHeights] = React.useState<number[]>([])
  const [itemPositions, setItemPositions] = React.useState<Array<{ x: number; y: number; height: number }>>([])
  
  // Responsive column calculation
  const columns = React.useMemo(() => {
    switch (screenSize) {
      case 'mobile': return 2
      case 'tablet': return 3
      case 'desktop': return 4
      default: return 3
    }
  }, [screenSize])
  
  React.useEffect(() => {
    // Initialize column heights
    const heights = new Array(columns).fill(0)
    const positions: Array<{ x: number; y: number; height: number }> = []
    
    items.forEach((item, index) => {
      // Find the shortest column
      const shortestColumnIndex = heights.indexOf(Math.min(...heights))
      const columnWidth = 100 / columns
      
      // Responsive height estimation
      let estimatedHeight = screenSize === 'mobile' ? 240 : 280 // Base height
      if (item.contentType === 'video') estimatedHeight += screenSize === 'mobile' ? 30 : 40
      if (item.contentType === 'text') estimatedHeight -= screenSize === 'mobile' ? 30 : 40
      if (item.description && item.description.length > 100) estimatedHeight += screenSize === 'mobile' ? 20 : 40
      
      positions[index] = {
        x: shortestColumnIndex * columnWidth,
        y: heights[shortestColumnIndex],
        height: estimatedHeight
      }
      
      heights[shortestColumnIndex] += estimatedHeight + (screenSize === 'mobile' ? 12 : 16) // Add gap
    })
    
    setColumnHeights(heights)
    setItemPositions(positions)
  }, [items, columns, screenSize])
  
  return { itemPositions, totalHeight: Math.max(...columnHeights), columns }
}

// Performance optimization settings
const PERFORMANCE_CONFIG = {
  itemsPerPage: 20,
  lazyLoadThreshold: 0.1,
  lazyLoadRootMargin: "100px",
  imageQuality: 75,
  enableVirtualScrolling: false // Can be enabled for very large datasets
}

// Mobile-optimized filter component
function ContentFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: ContentGridFilters
  onFiltersChange: (filters: ContentGridFilters) => void 
}) {
  const [showFilters, setShowFilters] = React.useState(false)
  const isMobile = useMobile()
  
  const updateFilter = (key: keyof ContentGridFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }
  
  const toggleArrayFilter = (key: 'status' | 'contentType' | 'platform', value: string) => {
    const currentArray = filters[key]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }
  
  const activeFiltersCount = filters.status.length + filters.contentType.length + filters.platform.length
  
  return (
    <div className="space-y-4">
      {/* Search and filter toggle */}
      <div className={cn(
        "flex items-center gap-3",
        isMobile && "flex-col space-y-3"
      )}>
        <div className={cn(
          "relative flex-1 max-w-md",
          isMobile && "w-full max-w-none"
        )}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contenido..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className={cn(
              "pl-10",
              isMobile && "mobile-form-input"
            )}
          />
        </div>
        
        <TouchFeedback
          onTap={() => setShowFilters(!showFilters)}
          hapticFeedback={isMobile}
          className={cn(isMobile && "w-full")}
        >
          <Button
            variant="outline"
            className={cn(
              "relative",
              isMobile && "w-full justify-center touch-target"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 ml-2 transition-transform",
              showFilters && "rotate-180"
            )} />
          </Button>
        </TouchFeedback>
      </div>
      
      {/* Expandable filters */}
      {showFilters && (
        <div className={cn(
          "p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border space-y-4",
          isMobile && "mobile-modal-content"
        )}>
          {/* Status filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">Estado</h4>
            <div className={cn(
              "flex flex-wrap gap-2",
              isMobile && "grid grid-cols-2 gap-2"
            )}>
              {statusOptions.map(option => (
                <TouchFeedback
                  key={option.value}
                  onTap={() => toggleArrayFilter('status', option.value)}
                  hapticFeedback={isMobile}
                >
                  <Button
                    variant={filters.status.includes(option.value) ? "default" : "outline"}
                    size={isMobile ? "default" : "sm"}
                    className={cn(
                      "text-xs",
                      isMobile && "w-full touch-target justify-center",
                      filters.status.includes(option.value) && option.color
                    )}
                  > <span>{option.label}</span></Button>
                </TouchFeedback>
              ))}
            </div>
          </div>
          
          {/* Content type filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tipo de contenido</h4>
            <div className={cn(
              "flex flex-wrap gap-2",
              isMobile && "grid grid-cols-2 gap-2"
            )}>
              {contentTypeOptions.map(option => (
                <TouchFeedback
                  key={option.value}
                  onTap={() => toggleArrayFilter('contentType', option.value)}
                  hapticFeedback={isMobile}
                >
                  <Button
                    variant={filters.contentType.includes(option.value) ? "default" : "outline"}
                    size={isMobile ? "default" : "sm"}
                    className={cn(
                      "text-xs",
                      isMobile && "w-full touch-target justify-center"
                    )}
                  > <span>{option.label}</span></Button>
                </TouchFeedback>
              ))}
            </div>
          </div>
          
          {/* Platform filters */}
          <div>
            <h4 className="text-sm font-medium mb-2">Plataforma</h4>
            <div className={cn(
              "flex flex-wrap gap-2",
              isMobile && "grid grid-cols-2 gap-2"
            )}>
              {platformOptions.map(option => (
                <TouchFeedback
                  key={option.value}
                  onTap={() => toggleArrayFilter('platform', option.value)}
                  hapticFeedback={isMobile}
                >
                  <Button
                    variant={filters.platform.includes(option.value) ? "default" : "outline"}
                    size={isMobile ? "default" : "sm"}
                    className={cn(
                      "text-xs",
                      isMobile && "w-full touch-target justify-center"
                    )}
                  > <span>{option.label}</span></Button>
                </TouchFeedback>
              ))}
            </div>
          </div>
          
          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => <span>onFiltersChange({
                  search: filters.search,
                  status: [],
                  contentType: [],
                  platform: [],
                  dateRange: {}
                })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros</span></Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main ContentGrid component
export function ContentGrid({
  items,
  loading = false,
  layout = 'masonry',
  selectedItems = [],
  onSelectionChange,
  onItemAction,
  onBulkAction,
  bulkActions,
  filters = {
    search: '',
    status: [],
    contentType: [],
    platform: [],
    dateRange: {}
  },
  onFiltersChange,
  enableBulkSelection = true,
  showKeyboardShortcuts = true,
  className
}: ContentGridProps) {
  const isMobile = useMobile()
  const screenSize = useScreenSize()
  const [currentLayout, setCurrentLayout] = React.useState(isMobile ? 'grid' : layout)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // Update layout based on screen size
  React.useEffect(() => {
    if (isMobile && currentLayout === 'masonry') {
      setCurrentLayout('grid')
    }
  }, [isMobile, currentLayout])
  
  // Filter items based on current filters
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          item.title.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false
      }
      
      // Content type filter
      if (filters.contentType.length > 0 && !filters.contentType.includes(item.contentType)) {
        return false
      }
      
      // Platform filter
      if (filters.platform.length > 0 && item.platform && !filters.platform.includes(item.platform)) {
        return false
      }
      
      return true
    })
  }, [items, filters])
  
  // Lazy loading with performance optimizations
  const { 
    visibleItems, 
    hasMore, 
    loading: loadingMore, 
    loadMore,
    observerRef: lazyLoadObserverRef
  } = useLazyLoading({
    items: filteredItems,
    itemsPerPage: PERFORMANCE_CONFIG.itemsPerPage,
    threshold: PERFORMANCE_CONFIG.lazyLoadThreshold,
    rootMargin: PERFORMANCE_CONFIG.lazyLoadRootMargin,
    enabled: !loading
  })
  
  // Responsive masonry layout calculation
  const { itemPositions, totalHeight, columns } = useMasonryLayout(visibleItems, screenSize)
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = React.useState({
    renderTime: 0,
    itemsRendered: 0,
    memoryUsage: 0
  })

  React.useEffect(() => {
    const startTime = performance.now()
    
    // Measure render performance
    const measurePerformance = () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime,
        itemsRendered: visibleItems.length
      }))
    }

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measurePerformance)
  }, [visibleItems.length])
  
  // Handle item selection
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (!onSelectionChange) return
    
    const newSelection = selected
      ? [...selectedItems, itemId]
      : selectedItems.filter(id => id !== itemId)
    
    onSelectionChange(newSelection)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    const allSelected = selectedItems.length === visibleItems.length
    onSelectionChange(allSelected ? [] : visibleItems.map(item => item.id))
  }
  
  return (
    <div className={cn("stack-spacing-lg", className)}>
      {/* Filters */}
      {onFiltersChange && (
        <ContentFilters filters={filters} onFiltersChange={onFiltersChange} />
      )}
      
      {/* Bulk Selection System */}
      {enableBulkSelection && onSelectionChange && onBulkAction && (
        <BulkSelectionSystem
          selectedItems={selectedItems}
          totalItems={filteredItems.length}
          onSelectionChange={onSelectionChange}
          onBulkAction={onBulkAction}
          actions={bulkActions}
          showKeyboardShortcuts={showKeyboardShortcuts}
        />
      )}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} contenidos
            {selectedItems.length > 0 && ` • ${selectedItems.length} seleccionados`}
          </p>
          
          {selectedItems.length > 0 && onSelectionChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            > <span>{selectedItems.length === visibleItems.length ? 'Deseleccionar todo' : 'Seleccionar todo'}</span></Button>
          )}
        </div>
        
        {/* Layout switcher */}
        {!isMobile && (
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <Button
              variant={currentLayout === 'masonry' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => <span>setCurrentLayout('masonry')}
              className="w-8 h-8"
            ></span><Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={currentLayout === 'grid' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => <span>setCurrentLayout('grid')}
              className="w-8 h-8"
            ></span><Grid2X2 className="w-4 h-4" />
            </Button>
            <Button
              variant={currentLayout === 'list' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => <span>setCurrentLayout('list')}
              className="w-8 h-8"
            ></span><List className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Mobile layout switcher */}
        {isMobile && (
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <TouchFeedback onTap={() => <span>setCurrentLayout('grid')} hapticFeedback></span><Button
                variant={currentLayout === 'grid' ? 'default' : 'ghost'}
                size="icon-sm"
                className="w-10 h-10 touch-target"
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>
            </TouchFeedback>
            <TouchFeedback onTap={() => <span>setCurrentLayout('list')} hapticFeedback></span><Button
                variant={currentLayout === 'list' ? 'default' : 'ghost'}
                size="icon-sm"
                className="w-10 h-10 touch-target"
              >
                <List className="w-4 h-4" />
              </Button>
            </TouchFeedback>
          </div>
        )}
      </div>
      
      {/* Content grid */}
      <div ref={containerRef} className="relative">
        {loading && visibleItems.length === 0 ? (
          // Loading skeleton
          <div className={cn(
            "grid gap-4",
            currentLayout === 'masonry' && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            currentLayout === 'grid' && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
            currentLayout === 'list' && "grid-cols-1"
          )}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"
                style={{ height: Math.random() * 100 + 200 }}
              />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No se encontró contenido</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.status.length > 0 || filters.contentType.length > 0 || filters.platform.length > 0
                ? 'Intenta ajustar los filtros para ver más resultados'
                : 'Aún no hay contenido creado'
              }
            </p>
            {onFiltersChange && (
              <Button
                variant="outline"
                onClick={() => <span>onFiltersChange({
                  search: '',
                  status: [],
                  contentType: [],
                  platform: [],
                  dateRange: {}
                })}
              >
                Limpiar filtros</span></Button>
            )}
          </div>
        ) : (
          <>
            {/* Masonry layout */}
            {currentLayout === 'masonry' && (
              <div 
                className="relative"
                style={{ height: totalHeight }}
              >
                {visibleItems.map((item, index) => {
                  const position = itemPositions[index]
                  if (!position) return null
                  
                  return (
                    <div
                      key={item.id}
                      className="absolute transition-all duration-300"
                      style={{
                        left: `${position.x}%`,
                        top: position.y,
                        width: `${100 / columns - 1}%`,
                      }}
                    >
                      <ContentCard
                        {...item}
                        selected={selectedItems.includes(item.id)}
                        onSelect={onSelectionChange ? (selected) => handleItemSelect(item.id, selected) : undefined}
                        onView={() => onItemAction?.(item.id, 'view')}
                        onEdit={() => onItemAction?.(item.id, 'edit')}
                      />
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Grid layout */}
            {currentLayout === 'grid' && (
              <div className={cn(
                "grid grid-spacing-standard",
                isMobile ? "mobile-content-grid" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              )}>
                {visibleItems.map((item) => {
                  const cardContent = (
                    <ContentCard
                      key={item.id}
                      {...item}
                      selected={selectedItems.includes(item.id)}
                      onSelect={onSelectionChange ? (selected) => handleItemSelect(item.id, selected) : undefined}
                      onView={() => onItemAction?.(item.id, 'view')}
                      onEdit={() => onItemAction?.(item.id, 'edit')}
                    />
                  )

                  // Wrap with swipe actions on mobile
                  if (isMobile && onItemAction) {
                    return (
                      <SwipeActions
                        key={item.id}
                        leftActions={[
                          {
                            ...commonSwipeActions.edit,
                            onAction: () => onItemAction(item.id, 'edit')
                          }
                        ]}
                        rightActions={[
                          {
                            ...commonSwipeActions.share,
                            onAction: () => onItemAction(item.id, 'share')
                          },
                          {
                            ...commonSwipeActions.delete,
                            onAction: () => onItemAction(item.id, 'delete')
                          }
                        ]}
                      >
                        {cardContent}
                      </SwipeActions>
                    )
                  }

                  return cardContent
                })}
              </div>
            )}
            
            {/* List layout */}
            {currentLayout === 'list' && (
              <div className="space-y-4">
                {visibleItems.map((item) => {
                  const listItemContent = (
                    <div className={cn(
                      "flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border",
                      isMobile && "p-3"
                    )}>
                      {onSelectionChange && (
                        <TouchFeedback
                          onTap={() => handleItemSelect(item.id, !selectedItems.includes(item.id))}
                          hapticFeedback={isMobile}
                          className="touch-target flex items-center justify-center"
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                            className={cn(
                              "w-4 h-4 rounded border-2 text-primary-600 focus:ring-primary-500",
                              isMobile && "w-5 h-5"
                            )}
                            aria-label={`Seleccionar ${item.title}`}
                          />
                        </TouchFeedback>
                      )}
                      <div className={cn(
                        "bg-neutral-100 dark:bg-neutral-800 rounded-lg flex-shrink-0",
                        isMobile ? "w-12 h-12" : "w-16 h-16"
                      )}>
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3X3 className={cn(
                              "text-muted-foreground",
                              isMobile ? "w-4 h-4" : "w-6 h-6"
                            )} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold truncate",
                          isMobile && "text-sm"
                        )}>{item.title}</h3>
                        {item.description && (
                          <p className={cn(
                            "text-muted-foreground line-clamp-2 mt-1",
                            isMobile ? "text-xs" : "text-sm"
                          )}>
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {statusOptions.find(s => s.value === item.status)?.label}
                          </Badge>
                          {item.platform && (
                            <Badge variant="secondary" className="text-xs">
                              {item.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!isMobile && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => <span>onItemAction?.(item.id, 'menu')}
                        ></span><MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )

                  // Wrap with swipe actions on mobile
                  if (isMobile && onItemAction) {
                    return (
                      <SwipeActions
                        key={item.id}
                        leftActions={[
                          {
                            ...commonSwipeActions.edit,
                            onAction: () => onItemAction(item.id, 'edit')
                          }
                        ]}
                        rightActions={[
                          {
                            ...commonSwipeActions.share,
                            onAction: () => onItemAction(item.id, 'share')
                          },
                          {
                            ...commonSwipeActions.delete,
                            onAction: () => onItemAction(item.id, 'delete')
                          }
                        ]}
                      >
                        {listItemContent}
                      </SwipeActions>
                    )
                  }

                  return (
                    <div key={item.id}>
                      {listItemContent}
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Load more trigger */}
            {hasMore && (
              <div ref={lazyLoadObserverRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Cargando más contenido...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="text-sm"
                  > <span>Cargar más contenido</span></Button>
                )}
              </div>
            )}

            {/* Performance metrics (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-xs text-muted-foreground">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium">Render Time:</span> {performanceMetrics.renderTime.toFixed(2)}ms
                  </div>
                  <div>
                    <span className="font-medium">Items Rendered:</span> {performanceMetrics.itemsRendered}
                  </div>
                  <div>
                    <span className="font-medium">Total Items:</span> {filteredItems.length}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}