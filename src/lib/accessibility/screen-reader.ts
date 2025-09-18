'use client'

import { useCallback, useRef } from 'react'

export type AnnouncementPriority = 'polite' | 'assertive'

/**
 * Announce messages to screen readers using live regions
 */
export function announceToScreenReader(
  message: string, 
  priority: AnnouncementPriority = 'polite'
): void {
  // Create or get existing live region
  let liveRegion = document.getElementById(`sr-live-region-${priority}`)
  
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = `sr-live-region-${priority}`
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(liveRegion)
  }

  // Clear previous content and set new message
  liveRegion.textContent = ''
  
  // Use setTimeout to ensure the change is detected by screen readers
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message
    }
  }, 100)

  // Clear the message after it's been announced
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = ''
    }
  }, 1000)
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReaderAnnouncements() {
  const announcementQueue = useRef<Array<{ message: string; priority: AnnouncementPriority }>>([])
  const isProcessing = useRef(false)

  const announce = useCallback((message: string, priority: AnnouncementPriority = 'polite') => {
    announcementQueue.current.push({ message, priority })
    processQueue()
  }, [])

  const processQueue = useCallback(() => {
    if (isProcessing.current || announcementQueue.current.length === 0) {
      return
    }

    isProcessing.current = true
    const { message, priority } = announcementQueue.current.shift()!

    announceToScreenReader(message, priority)

    // Wait before processing next announcement
    setTimeout(() => {
      isProcessing.current = false
      processQueue()
    }, 1500)
  }, [])

  const clearQueue = useCallback(() => {
    announcementQueue.current = []
    isProcessing.current = false
  }, [])

  return {
    announce,
    clearQueue
  }
}

/**
 * Create ARIA labels and descriptions for tour elements
 */
export function createAriaAttributes(
  stepIndex: number,
  totalSteps: number,
  title: string,
  description: string
) {
  const stepLabel = `Paso ${stepIndex + 1} de ${totalSteps}: ${title}`
  const stepDescription = `${description}. Use las flechas del teclado para navegar, Escape para cerrar.`

  return {
    'aria-label': stepLabel,
    'aria-describedby': `tour-step-description-${stepIndex}`,
    'aria-current': 'step',
    'aria-setsize': totalSteps,
    'aria-posinset': stepIndex + 1,
    role: 'dialog',
    'aria-modal': 'true'
  }
}

/**
 * Generate screen reader optimized descriptions
 */
export function generateScreenReaderDescription(
  title: string,
  description: string,
  stepIndex: number,
  totalSteps: number,
  hasNext: boolean,
  hasPrevious: boolean
): string {
  let srDescription = `${title}. ${description}.`
  
  // Add navigation context
  srDescription += ` Paso ${stepIndex + 1} de ${totalSteps}.`
  
  // Add available actions
  const actions: string[] = []
  if (hasPrevious) actions.push('flecha izquierda para anterior')
  if (hasNext) actions.push('flecha derecha para siguiente')
  actions.push('Escape para cerrar')
  
  if (actions.length > 0) {
    srDescription += ` Presione ${actions.join(', ')}.`
  }

  return srDescription
}

/**
 * Hook for managing tour progress announcements
 */
export function useTourProgressAnnouncements() {
  const { announce } = useScreenReaderAnnouncements()

  const announceStepChange = useCallback((
    stepIndex: number,
    totalSteps: number,
    title: string,
    direction: 'next' | 'previous' | 'start' = 'next'
  ) => {
    let message = ''
    
    switch (direction) {
      case 'start':
        message = `Tour iniciado. ${title}. Paso 1 de ${totalSteps}.`
        break
      case 'next':
        message = `Avanzando al paso ${stepIndex + 1} de ${totalSteps}. ${title}.`
        break
      case 'previous':
        message = `Regresando al paso ${stepIndex + 1} de ${totalSteps}. ${title}.`
        break
    }
    
    announce(message, 'assertive')
  }, [announce])

  const announceTourComplete = useCallback(() => {
    announce('Tour completado exitosamente.', 'assertive')
  }, [announce])

  const announceTourSkipped = useCallback(() => {
    announce('Tour omitido.', 'assertive')
  }, [announce])

  const announceTourError = useCallback((error: string) => {
    announce(`Error en el tour: ${error}`, 'assertive')
  }, [announce])

  const announceKeyboardShortcuts = useCallback(() => {
    const shortcuts = [
      'Use las flechas del teclado para navegar entre pasos',
      'Presione Escape para cerrar el tour',
      'Presione Espacio para pausar o reanudar',
      'Presione Home para reiniciar',
      'Presione End para omitir'
    ].join('. ')
    
    announce(`Atajos de teclado disponibles: ${shortcuts}`, 'polite')
  }, [announce])

  return {
    announceStepChange,
    announceTourComplete,
    announceTourSkipped,
    announceTourError,
    announceKeyboardShortcuts
  }
}

/**
 * Create live region for dynamic content updates
 */
export function createLiveRegion(
  id: string,
  priority: AnnouncementPriority = 'polite'
): HTMLElement {
  let liveRegion = document.getElementById(id)
  
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = id
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(liveRegion)
  }

  return liveRegion
}

/**
 * Remove live region from DOM
 */
export function removeLiveRegion(id: string): void {
  const liveRegion = document.getElementById(id)
  if (liveRegion) {
    document.body.removeChild(liveRegion)
  }
}

/**
 * Check if screen reader is likely being used
 */
export function isScreenReaderActive(): boolean {
  // Check for common screen reader indicators
  const indicators = [
    // NVDA
    () => 'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0,
    // JAWS, NVDA, others
    () => navigator.userAgent.includes('JAWS') || navigator.userAgent.includes('NVDA'),
    // Check for reduced motion preference (often used by screen reader users)
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Check for high contrast preference
    () => window.matchMedia('(prefers-contrast: high)').matches
  ]

  return indicators.some(check => {
    try {
      return check()
    } catch {
      return false
    }
  })
}

/**
 * Enhanced ARIA attributes for complex tour interactions
 */
export function createEnhancedAriaAttributes(
  stepIndex: number,
  totalSteps: number,
  title: string,
  description: string,
  elementType: 'button' | 'link' | 'input' | 'generic' = 'generic'
) {
  const baseAttributes = createAriaAttributes(stepIndex, totalSteps, title, description)
  
  const enhancedAttributes = {
    ...baseAttributes,
    'aria-roledescription': 'paso del tour',
    'aria-keyshortcuts': 'ArrowLeft ArrowRight Escape Space Home End'
  }

  // Add element-specific attributes
  switch (elementType) {
    case 'button':
      enhancedAttributes['aria-expanded'] = 'false'
      break
    case 'link':
      enhancedAttributes['aria-describedby'] += ' tour-link-description'
      break
    case 'input':
      enhancedAttributes['aria-required'] = 'false'
      enhancedAttributes['aria-invalid'] = 'false'
      break
  }

  return enhancedAttributes
}