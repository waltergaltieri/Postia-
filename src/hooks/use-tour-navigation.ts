/**
 * Hook for integrating tours with navigation system
 * 
 * This hook provides tour-aware navigation functionality, including:
 * - Tour progress indicators in navigation
 * - Navigation locking during tours
 * - Tour-aware breadcrumbs
 * - Navigation event handling during tours
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNavigation } from '@/components/navigation/navigation-context'
import { useTour } from '@/components/onboarding/tour-provider'
import { 
  TourNavigationState,
  TourNavigationConfig,
  TourNavigationHandler,
  createTourNavigationState,
  isPageTourCompatible,
  getSuggestedToursForContext
} from '@/lib/tour/navigation-integration'
import { TourConfigLoader } from '@/lib/tour/tour-config'

interface UseTourNavigationConfig extends TourNavigationConfig {
  autoSuggestTours?: boolean
  confirmNavigationExit?: boolean
}

interface UseTourNavigationReturn {
  // State
  tourNavState: TourNavigationState
  isNavigationLocked: boolean
  suggestedTours: string[]
  
  // Actions
  handleNavigationAttempt: (targetPath: string) => boolean
  updateTourBreadcrumbs: () => void
  getSuggestedTours: () => string[]
  
  // Utilities
  isCurrentPageTourCompatible: boolean
  canStartTour: (tourId: string) => boolean
}

export function useTourNavigation(
  config: UseTourNavigationConfig = {}
): UseTourNavigationReturn {
  const router = useRouter()
  const pathname = usePathname()
  const navigation = useNavigation()
  const tour = useTour()
  
  const [tourNavState, setTourNavState] = useState<TourNavigationState>({
    activeTourId: null,
    currentStep: 0,
    totalSteps: 0,
    showProgressInNav: true,
    tourBreadcrumbs: [],
    navigationLocked: false
  })
  
  const [suggestedTours, setSuggestedTours] = useState<string[]>([])
  const [navigationHandler] = useState(() => new TourNavigationHandler(
    // onNavigationAttempt callback
    (targetPath: string, tourId: string) => {
      if (!config.confirmNavigationExit) return true
      
      return window.confirm(
        '¿Estás seguro de que quieres salir del tour? Tu progreso se guardará automáticamente.'
      )
    },
    // onTourInterrupted callback
    (tourId: string, targetPath: string) => {
      console.log(`Tour ${tourId} interrupted by navigation to ${targetPath}`)
      // Tour will be automatically paused by the tour provider
    }
  ))

  // Update tour navigation state when tour state changes
  useEffect(() => {
    const updateTourNavState = async () => {
      if (!tour.isActive || !tour.currentTour) {
        setTourNavState({
          activeTourId: null,
          currentStep: 0,
          totalSteps: 0,
          showProgressInNav: true,
          tourBreadcrumbs: [],
          navigationLocked: false
        })
        return
      }

      try {
        // Load tour definition to get metadata
        const tourDefinition = TourConfigLoader.getTourConfig(tour.currentTour)
        
        const newState = createTourNavigationState(
          tour.currentTour,
          tour.currentStep,
          tour.totalSteps,
          tourDefinition,
          config
        )
        
        setTourNavState(newState)
        
        // Update navigation breadcrumbs if enabled
        if (config.addTourBreadcrumbs && newState.tourBreadcrumbs.length > 0) {
          navigation.setBreadcrumbs(newState.tourBreadcrumbs)
        }
      } catch (error) {
        console.error('Failed to update tour navigation state:', error)
      }
    }

    updateTourNavState()
  }, [
    tour.isActive, 
    tour.currentTour, 
    tour.currentStep, 
    tour.totalSteps,
    config.addTourBreadcrumbs,
    navigation
  ])

  // Update suggested tours when navigation context changes
  useEffect(() => {
    if (!config.autoSuggestTours) return

    const suggestions = getSuggestedToursForContext(
      pathname,
      navigation.currentClient?.id,
      'user' // This would come from your auth system
    )
    
    setSuggestedTours(suggestions)
  }, [
    pathname, 
    navigation.currentClient?.id, 
    config.autoSuggestTours
  ])

  // Handle navigation attempts during active tours
  const handleNavigationAttempt = useCallback((targetPath: string): boolean => {
    if (!tour.isActive || !tour.currentTour) return true
    
    return navigationHandler.handleNavigationAttempt(
      targetPath,
      tour.currentTour,
      tourNavState.navigationLocked
    )
  }, [tour.isActive, tour.currentTour, tourNavState.navigationLocked, navigationHandler])

  // Update tour breadcrumbs manually
  const updateTourBreadcrumbs = useCallback(() => {
    if (!tour.isActive || !tour.currentTour || !config.addTourBreadcrumbs) return

    try {
      const tourDefinition = TourConfigLoader.getTourConfig(tour.currentTour)
      if (!tourDefinition) return

      const currentStep = tourDefinition.steps[tour.currentStep]
      if (!currentStep) return

      navigationHandler.updateNavigationForTourStep(
        currentStep,
        tourDefinition,
        navigation.setBreadcrumbs
      )
    } catch (error) {
      console.error('Failed to update tour breadcrumbs:', error)
    }
  }, [
    tour.isActive,
    tour.currentTour,
    tour.currentStep,
    config.addTourBreadcrumbs,
    navigation.setBreadcrumbs,
    navigationHandler
  ])

  // Get suggested tours for current context
  const getSuggestedTours = useCallback((): string[] => {
    return getSuggestedToursForContext(
      pathname,
      navigation.currentClient?.id,
      'user' // This would come from your auth system
    )
  }, [pathname, navigation.currentClient?.id])

  // Check if a tour can be started in current context
  const canStartTour = useCallback((tourId: string): boolean => {
    // Don't start tours if another is active
    if (tour.isActive) return false
    
    // Check if current page supports tours
    if (!isPageTourCompatible(pathname)) return false
    
    try {
      const tourDefinition = TourConfigLoader.getTourConfig(tourId)
      if (!tourDefinition) return false
      
      // Check tour conditions (simplified)
      if (tourDefinition.conditions) {
        for (const condition of tourDefinition.conditions) {
          switch (condition.type) {
            case 'client_selected':
              if (condition.operator === 'exists' && !navigation.currentClient) {
                return false
              }
              break
            case 'page_path':
              if (condition.operator === 'equals' && pathname !== condition.value) {
                return false
              }
              if (condition.operator === 'contains' && !pathname.includes(condition.value)) {
                return false
              }
              break
          }
        }
      }
      
      return true
    } catch (error) {
      console.error(`Failed to check if tour ${tourId} can start:`, error)
      return false
    }
  }, [tour.isActive, pathname, navigation.currentClient])

  return {
    // State
    tourNavState,
    isNavigationLocked: tourNavState.navigationLocked,
    suggestedTours,
    
    // Actions
    handleNavigationAttempt,
    updateTourBreadcrumbs,
    getSuggestedTours,
    
    // Utilities
    isCurrentPageTourCompatible: isPageTourCompatible(pathname),
    canStartTour
  }
}

/**
 * Hook for navigation-aware tour controls
 */
export function useTourNavigationControls() {
  const { handleNavigationAttempt, isNavigationLocked } = useTourNavigation()
  const router = useRouter()
  
  const navigateWithTourCheck = useCallback((path: string) => {
    if (handleNavigationAttempt(path)) {
      router.push(path)
    }
  }, [handleNavigationAttempt, router])
  
  const replaceWithTourCheck = useCallback((path: string) => {
    if (handleNavigationAttempt(path)) {
      router.replace(path)
    }
  }, [handleNavigationAttempt, router])
  
  return {
    navigateWithTourCheck,
    replaceWithTourCheck,
    isNavigationLocked,
    canNavigate: (path: string) => handleNavigationAttempt(path)
  }
}

/**
 * Hook for tour-aware breadcrumb management
 */
export function useTourBreadcrumbs() {
  const { tourNavState, updateTourBreadcrumbs } = useTourNavigation({
    addTourBreadcrumbs: true
  })
  const navigation = useNavigation()
  
  const addTourAwareBreadcrumb = useCallback((
    label: string,
    href: string,
    metadata?: any
  ) => {
    const breadcrumb = {
      label,
      href,
      metadata: {
        ...metadata,
        addedDuringTour: tourNavState.activeTourId
      }
    }
    
    navigation.addBreadcrumb(breadcrumb)
  }, [navigation, tourNavState.activeTourId])
  
  return {
    tourBreadcrumbs: tourNavState.tourBreadcrumbs,
    updateTourBreadcrumbs,
    addTourAwareBreadcrumb,
    hasTourBreadcrumbs: tourNavState.tourBreadcrumbs.length > 0
  }
}