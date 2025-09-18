/**
 * Hook for managing client branding in tours
 * 
 * This hook provides functionality to apply and manage client branding
 * for tours, including dynamic styling and brand-aware content.
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigation } from '@/components/navigation/navigation-context'
import { useTour } from '@/components/onboarding/tour-provider'
import { 
  ClientBrandingConfig,
  BrandedTourConfig,
  tourBrandingManager,
  applyClientBrandingToTour,
  shouldApplyClientBranding,
  createBrandAwareTourContent,
  getBrandedTourMessages
} from '@/lib/tour/client-branding-integration'
import { TourConfigLoader } from '@/lib/tour/tour-config'

interface UseTourBrandingConfig {
  autoApplyBranding?: boolean
  enableBrandedContent?: boolean
  enableBrandedMessages?: boolean
}

interface UseTourBrandingReturn {
  // State
  currentBranding: ClientBrandingConfig | null
  isBrandingApplied: boolean
  brandedMessages: Record<string, string> | null
  
  // Actions
  applyBrandingToTour: (tourId: string) => BrandedTourConfig | null
  removeBranding: () => void
  updateBrandedContent: (content: string) => string
  
  // Utilities
  shouldUseBranding: (tourId: string) => boolean
  getBrandingForClient: (clientId: string) => ClientBrandingConfig | null
}

export function useTourBranding(
  config: UseTourBrandingConfig = {}
): UseTourBrandingReturn {
  const navigation = useNavigation()
  const tour = useTour()
  
  const [currentBranding, setCurrentBranding] = useState<ClientBrandingConfig | null>(null)
  const [isBrandingApplied, setIsBrandingApplied] = useState(false)
  const [brandedMessages, setBrandedMessages] = useState<Record<string, string> | null>(null)

  // Convert navigation client to branding config
  const convertClientToBrandingConfig = useCallback((client: any): ClientBrandingConfig | null => {
    if (!client) return null
    
    return {
      id: client.id,
      brandName: client.brandName,
      brandColors: client.brandColors || ['#3b82f6'],
      logoUrl: client.logoUrl,
      typography: client.typography,
      customCSS: client.customCSS
    }
  }, [])

  // Update branding when client changes
  useEffect(() => {
    const newBranding = convertClientToBrandingConfig(navigation.currentClient)
    setCurrentBranding(newBranding)
    
    // Update branding manager
    tourBrandingManager.setClientBranding(newBranding)
    
    // Update branded messages
    if (newBranding && config.enableBrandedMessages) {
      setBrandedMessages(getBrandedTourMessages(newBranding))
    } else {
      setBrandedMessages(null)
    }
  }, [navigation.currentClient, config.enableBrandedMessages, convertClientToBrandingConfig])

  // Auto-apply branding when tour starts
  useEffect(() => {
    if (!config.autoApplyBranding || !tour.isActive || !tour.currentTour) {
      return
    }

    if (currentBranding && shouldApplyClientBranding(tour.currentTour, currentBranding)) {
      const brandedConfig = tourBrandingManager.applyBrandingForTour(tour.currentTour)
      setIsBrandingApplied(!!brandedConfig)
    }
  }, [
    tour.isActive, 
    tour.currentTour, 
    currentBranding, 
    config.autoApplyBranding
  ])

  // Remove branding when tour ends
  useEffect(() => {
    if (!tour.isActive && isBrandingApplied) {
      tourBrandingManager.removeBranding()
      setIsBrandingApplied(false)
    }
  }, [tour.isActive, isBrandingApplied])

  // Apply branding to a specific tour
  const applyBrandingToTour = useCallback((tourId: string): BrandedTourConfig | null => {
    if (!currentBranding || !shouldApplyClientBranding(tourId, currentBranding)) {
      return null
    }

    try {
      // Get base tour configuration
      const baseTourConfig = TourConfigLoader.getTourConfig(tourId)
      if (!baseTourConfig) {
        console.warn(`Tour configuration not found: ${tourId}`)
        return null
      }

      // Apply branding to tour config
      const brandedConfig = applyClientBrandingToTour(baseTourConfig, currentBranding)
      
      // Apply branding styles
      const appliedConfig = tourBrandingManager.applyBrandingForTour(tourId)
      setIsBrandingApplied(!!appliedConfig)
      
      return brandedConfig
    } catch (error) {
      console.error(`Failed to apply branding to tour ${tourId}:`, error)
      return null
    }
  }, [currentBranding])

  // Remove branding manually
  const removeBranding = useCallback(() => {
    tourBrandingManager.removeBranding()
    setIsBrandingApplied(false)
  }, [])

  // Update content with branding
  const updateBrandedContent = useCallback((content: string): string => {
    if (!currentBranding || !config.enableBrandedContent) {
      return content
    }

    return createBrandAwareTourContent(content, currentBranding)
  }, [currentBranding, config.enableBrandedContent])

  // Check if branding should be used for a tour
  const shouldUseBranding = useCallback((tourId: string): boolean => {
    return shouldApplyClientBranding(tourId, currentBranding)
  }, [currentBranding])

  // Get branding for a specific client
  const getBrandingForClient = useCallback((clientId: string): ClientBrandingConfig | null => {
    const client = navigation.clients.find(c => c.id === clientId)
    return convertClientToBrandingConfig(client)
  }, [navigation.clients, convertClientToBrandingConfig])

  return {
    // State
    currentBranding,
    isBrandingApplied,
    brandedMessages,
    
    // Actions
    applyBrandingToTour,
    removeBranding,
    updateBrandedContent,
    
    // Utilities
    shouldUseBranding,
    getBrandingForClient
  }
}

/**
 * Hook for branded tour content
 */
export function useBrandedTourContent() {
  const { currentBranding, updateBrandedContent, brandedMessages } = useTourBranding({
    enableBrandedContent: true,
    enableBrandedMessages: true
  })

  const getBrandedTitle = useCallback((baseTitle: string): string => {
    return updateBrandedContent(baseTitle)
  }, [updateBrandedContent])

  const getBrandedDescription = useCallback((baseDescription: string): string => {
    return updateBrandedContent(baseDescription)
  }, [updateBrandedContent])

  const getBrandedMessage = useCallback((messageKey: string): string => {
    return brandedMessages?.[messageKey] || ''
  }, [brandedMessages])

  return {
    currentBranding,
    getBrandedTitle,
    getBrandedDescription,
    getBrandedMessage,
    brandedMessages
  }
}

/**
 * Hook for tour branding controls
 */
export function useTourBrandingControls() {
  const { 
    applyBrandingToTour, 
    removeBranding, 
    shouldUseBranding,
    isBrandingApplied 
  } = useTourBranding()

  const startBrandedTour = useCallback(async (tourId: string) => {
    if (shouldUseBranding(tourId)) {
      const brandedConfig = applyBrandingToTour(tourId)
      if (brandedConfig) {
        console.log(`Applied branding to tour: ${tourId}`)
        return brandedConfig
      }
    }
    return null
  }, [shouldUseBranding, applyBrandingToTour])

  const endBrandedTour = useCallback(() => {
    if (isBrandingApplied) {
      removeBranding()
      console.log('Removed tour branding')
    }
  }, [isBrandingApplied, removeBranding])

  return {
    startBrandedTour,
    endBrandedTour,
    isBrandingApplied,
    shouldUseBranding
  }
}