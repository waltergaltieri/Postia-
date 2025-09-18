'use client'

import React from 'react'
import { 
  createAriaAttributes, 
  generateScreenReaderDescription,
  createEnhancedAriaAttributes 
} from '@/lib/accessibility'

interface TourAriaDescriptionProps {
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  elementType?: 'button' | 'link' | 'input' | 'generic'
  hasNext?: boolean
  hasPrevious?: boolean
  customInstructions?: string[]
  keyboardShortcuts?: string[]
  children?: React.ReactNode
}

/**
 * Component that provides comprehensive ARIA descriptions for tour steps
 */
export function TourAriaDescription({
  stepIndex,
  totalSteps,
  title,
  description,
  elementType = 'generic',
  hasNext = true,
  hasPrevious = true,
  customInstructions = [],
  keyboardShortcuts = ['ArrowLeft', 'ArrowRight', 'Escape', 'Space', 'Home', 'End'],
  children
}: TourAriaDescriptionProps) {
  const descriptionId = React.useId()
  const instructionsId = React.useId()
  const shortcutsId = React.useId()

  // Generate enhanced ARIA attributes
  const ariaAttributes = createEnhancedAriaAttributes(
    stepIndex,
    totalSteps,
    title,
    description,
    elementType
  )

  // Generate comprehensive screen reader description
  const screenReaderDescription = generateScreenReaderDescription(
    title,
    description,
    stepIndex,
    totalSteps,
    hasNext,
    hasPrevious
  )

  // Generate keyboard shortcuts description
  const shortcutsDescription = React.useMemo(() => {
    const shortcuts = [
      ...(hasPrevious ? ['Flecha izquierda: paso anterior'] : []),
      ...(hasNext ? ['Flecha derecha: siguiente paso'] : []),
      'Escape: cerrar tour',
      'Espacio: pausar/reanudar',
      'Home: reiniciar tour',
      'End: omitir tour',
      ...customInstructions
    ]
    
    return `Atajos de teclado disponibles: ${shortcuts.join(', ')}.`
  }, [hasNext, hasPrevious, customInstructions])

  // Generate navigation instructions
  const navigationInstructions = React.useMemo(() => {
    const instructions = []
    
    if (hasPrevious) {
      instructions.push('Use flecha izquierda o el botón Anterior para ir al paso previo')
    }
    
    if (hasNext) {
      instructions.push('Use flecha derecha o el botón Siguiente para continuar')
    } else {
      instructions.push('Use el botón Finalizar para completar el tour')
    }
    
    instructions.push('Presione Escape para cerrar el tour en cualquier momento')
    
    return instructions.join('. ') + '.'
  }, [hasNext, hasPrevious])

  return (
    <>
      {/* Main description for screen readers */}
      <div 
        id={descriptionId}
        className="sr-only"
        aria-hidden="true"
      >
        {screenReaderDescription}
      </div>

      {/* Navigation instructions */}
      <div 
        id={instructionsId}
        className="sr-only"
        aria-hidden="true"
      >
        {navigationInstructions}
      </div>

      {/* Keyboard shortcuts */}
      <div 
        id={shortcutsId}
        className="sr-only"
        aria-hidden="true"
      >
        {shortcutsDescription}
      </div>

      {/* Enhanced ARIA attributes provider */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...ariaAttributes,
            'aria-describedby': [
              child.props['aria-describedby'],
              descriptionId,
              instructionsId,
              shortcutsId
            ].filter(Boolean).join(' ')
          })
        }
        return child
      })}
    </>
  )
}

/**
 * Hook for generating ARIA attributes for tour elements
 */
export function useTourAriaAttributes(
  stepIndex: number,
  totalSteps: number,
  title: string,
  description: string,
  elementType: 'button' | 'link' | 'input' | 'generic' = 'generic'
) {
  const descriptionId = React.useId()
  
  const ariaAttributes = React.useMemo(() => {
    return createEnhancedAriaAttributes(
      stepIndex,
      totalSteps,
      title,
      description,
      elementType
    )
  }, [stepIndex, totalSteps, title, description, elementType])

  const screenReaderDescription = React.useMemo(() => {
    return generateScreenReaderDescription(
      title,
      description,
      stepIndex,
      totalSteps,
      stepIndex < totalSteps - 1,
      stepIndex > 0
    )
  }, [title, description, stepIndex, totalSteps])

  return {
    ariaAttributes: {
      ...ariaAttributes,
      'aria-describedby': `${ariaAttributes['aria-describedby']} ${descriptionId}`
    },
    screenReaderDescription,
    descriptionId,
    DescriptionElement: () => (
      <div 
        id={descriptionId}
        className="sr-only"
        aria-hidden="true"
      >
        {screenReaderDescription}
      </div>
    )
  }
}

/**
 * Component for tour step progress announcements
 */
export function TourProgressAnnouncement({
  currentStep,
  totalSteps,
  title,
  isComplete = false,
  isSkipped = false
}: {
  currentStep: number
  totalSteps: number
  title: string
  isComplete?: boolean
  isSkipped?: boolean
}) {
  const announcementId = React.useId()

  const announcement = React.useMemo(() => {
    if (isComplete) {
      return 'Tour completado exitosamente. Todas las funcionalidades han sido presentadas.'
    }
    
    if (isSkipped) {
      return 'Tour omitido. Puede acceder a la ayuda desde el menú principal en cualquier momento.'
    }
    
    return `Paso ${currentStep} de ${totalSteps}: ${title}. ${
      currentStep === totalSteps 
        ? 'Este es el último paso del tour.' 
        : `Quedan ${totalSteps - currentStep} pasos por completar.`
    }`
  }, [currentStep, totalSteps, title, isComplete, isSkipped])

  return (
    <div 
      id={announcementId}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}