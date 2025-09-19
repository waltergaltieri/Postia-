'use client'

import * as React from 'react'
import { TourPopover } from './tour-popover'
import { TourSpotlight, useSpotlight } from './tour-spotlight'
import { TourControls, useTourControls } from './tour-controls'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Demo component showcasing the integration of all tour UI components
 * This demonstrates how TourPopover, TourSpotlight, and TourControls work together
 */
export function TourUIDemo() {
  const [isActive, setIsActive] = React.useState(false)
  const [showPopover, setShowPopover] = React.useState(false)
  const spotlight = useSpotlight()
  const controls = useTourControls()
  const demoElementRef = React.useRef<HTMLDivElement>(null)

  // Demo tour steps
  const tourSteps = [
    {
      title: 'Bienvenido al Tour',
      description: 'Este es un ejemplo de cómo funcionan los componentes de UI del tour juntos.',
      target: null
    },
    {
      title: 'Elemento Destacado',
      description: 'Este elemento está siendo destacado por el componente TourSpotlight.',
      target: demoElementRef.current
    },
    {
      title: 'Controles del Tour',
      description: 'Los controles en la parte inferior te permiten navegar por el tour.',
      target: null
    }
  ]

  // Initialize tour
  React.useEffect(() => {
    controls.setTotalSteps(tourSteps.length)
  }, [controls])

  // Handle tour step changes
  React.useEffect(() => {
    if (!isActive) return

    const currentTourStep = tourSteps[controls.currentStep - 1]
    
    if (currentTourStep.target) {
      spotlight.showSpotlight(currentTourStep.target)
    } else {
      spotlight.hideSpotlight()
    }
  }, [controls.currentStep, isActive, spotlight])

  const startTour = () => {
    setIsActive(true)
    setShowPopover(true)
    controls.goToStep(1)
  }

  const stopTour = () => {
    setIsActive(false)
    setShowPopover(false)
    spotlight.hideSpotlight()
    controls.goToStep(1)
  }

  const handleNext = () => {
    if (controls.currentStep < controls.totalSteps) {
      controls.nextStep()
    } else {
      stopTour()
    }
  }

  const handlePrevious = () => {
    controls.previousStep()
  }

  const currentTourStep = tourSteps[controls.currentStep - 1]

  return (
    <div className="relative min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Demo de Componentes de Tour UI</h1>
          <p className="text-muted-foreground">
            Demostración de TourPopover, TourSpotlight y TourControls trabajando juntos
          </p>
          
          {!isActive ? (
            <Button onClick={startTour} size="lg"> <span>Iniciar Tour Demo</span></Button>
          ) : (
            <Button onClick={stopTour} variant="outline"> <span>Detener Tour</span></Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Elemento Normal</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Este es un elemento normal que no será destacado en el tour.</p>
            </CardContent>
          </Card>

          <Card ref={demoElementRef}>
            <CardHeader>
              <CardTitle>Elemento del Tour</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Este elemento será destacado durante el paso 2 del tour.</p>
              <Button variant="outline" className="mt-4"> <span>Botón de Ejemplo</span></Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} variant="flat">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Elemento de relleno {i + 1}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tour UI Components */}
      {isActive && (
        <>
          {/* Spotlight overlay */}
          <TourSpotlight
            targetElement={spotlight.targetElement}
            isVisible={spotlight.isVisible}
            onOverlayClick={stopTour}
          />

          {/* Popover with tour content */}
          {showPopover && currentTourStep && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
              <TourPopover
                title={currentTourStep.title}
                description={currentTourStep.description}
                currentStep={controls.currentStep}
                totalSteps={controls.totalSteps}
                onNext={handleNext}
                onPrevious={controls.currentStep > 1 ? handlePrevious : undefined}
                onSkip={stopTour}
                onClose={stopTour}
                isVisible={showPopover}
              />
            </div>
          )}

          {/* Tour controls */}
          <TourControls
            currentStep={controls.currentStep}
            totalSteps={controls.totalSteps}
            canGoNext={controls.canGoNext}
            canGoPrevious={controls.canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={stopTour}
            onClose={stopTour}
            showProgress={true}
            showStepCounter={true}
            position="bottom"
          />
        </>
      )}
    </div>
  )
}