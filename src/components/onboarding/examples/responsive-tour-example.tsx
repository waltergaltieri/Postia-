'use client'

import * as React from 'react'
import { useResponsiveTour, useResponsiveTourConfig } from '@/hooks/use-responsive-tour'
import { ResponsiveTourController } from '../responsive-tour-controller'
import { ResponsiveTourStep } from '@/lib/tour/responsive-tour-adapter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Example responsive tour steps
const exampleSteps: ResponsiveTourStep[] = [
  {
    element: '[data-tour="welcome-header"]',
    title: 'Bienvenido a Postia SaaS',
    description: 'Esta es una demostración del sistema de tours responsivo que se adapta a tu dispositivo.',
    position: 'bottom',
    
    // Mobile-specific content
    mobileTitle: 'Bienvenido',
    mobileDescription: 'Tour responsivo que se adapta a tu móvil.',
    mobilePosition: 'bottom',
    touchInstructions: 'Toca para continuar o desliza hacia la izquierda',
    
    // Tablet-specific content
    tabletTitle: 'Bienvenido a Postia',
    tabletDescription: 'Tour responsivo que se adapta a diferentes dispositivos.',
    tabletPosition: 'bottom',
    
    // Desktop-specific content
    desktopTitle: 'Bienvenido a Postia SaaS',
    desktopDescription: 'Esta es una demostración completa del sistema de tours responsivo que se adapta automáticamente a tu dispositivo y tamaño de pantalla.',
    desktopPosition: 'bottom',
    
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true
  },
  {
    element: '[data-tour="responsive-features"]',
    title: 'Características Responsivas',
    description: 'El tour se adapta automáticamente al tamaño de pantalla y capacidades del dispositivo.',
    position: 'right',
    
    mobileTitle: 'Adaptativo',
    mobileDescription: 'Se adapta a tu pantalla automáticamente.',
    mobilePosition: 'center',
    touchInstructions: 'Desliza para explorar las características',
    
    tabletTitle: 'Características Adaptativas',
    tabletDescription: 'El tour se adapta al tamaño de pantalla y tipo de dispositivo.',
    tabletPosition: 'right',
    
    desktopTitle: 'Sistema Completamente Responsivo',
    desktopDescription: 'Nuestro sistema de tours se adapta inteligentemente al tamaño de pantalla, tipo de dispositivo, capacidades táctiles y orientación para ofrecer la mejor experiencia posible.',
    desktopPosition: 'right',
    
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true
  },
  {
    element: '[data-tour="touch-gestures"]',
    title: 'Gestos Táctiles',
    description: 'En dispositivos táctiles, puedes usar gestos para navegar por el tour.',
    position: 'left',
    
    mobileTitle: 'Gestos',
    mobileDescription: 'Usa gestos para navegar.',
    mobilePosition: 'top',
    touchInstructions: 'Desliza horizontalmente para navegar',
    swipeDirection: 'left',
    tapTarget: true,
    
    tabletTitle: 'Gestos Táctiles',
    tabletDescription: 'Usa gestos táctiles para una navegación más natural.',
    tabletPosition: 'left',
    
    desktopTitle: 'Soporte para Gestos Táctiles',
    desktopDescription: 'En dispositivos con capacidades táctiles, el tour soporta gestos naturales como deslizar para navegar entre pasos y tocar para avanzar.',
    desktopPosition: 'left',
    
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: false // Hide on desktop as it doesn't have touch
  },
  {
    element: '[data-tour="accessibility-features"]',
    title: 'Accesibilidad',
    description: 'El tour incluye características de accesibilidad como soporte para lectores de pantalla.',
    position: 'top',
    
    mobileTitle: 'Accesible',
    mobileDescription: 'Soporte completo para accesibilidad.',
    mobilePosition: 'center',
    
    tabletTitle: 'Características de Accesibilidad',
    tabletDescription: 'Soporte completo para lectores de pantalla y navegación por teclado.',
    tabletPosition: 'top',
    
    desktopTitle: 'Accesibilidad Completa',
    desktopDescription: 'El sistema incluye soporte completo para lectores de pantalla, navegación por teclado, alto contraste y movimiento reducido para usuarios con diferentes necesidades.',
    desktopPosition: 'top',
    
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true
  }
]

export function ResponsiveTourExample() {
  const [isManualTourActive, setIsManualTourActive] = React.useState(false)

  // Example using the responsive tour hook directly
  const responsiveTour = useResponsiveTour({
    tourId: 'responsive-example-tour',
    steps: exampleSteps,
    autoStart: false,
    adaptContent: true,
    adaptLayout: true,
    enableSwipeGestures: true,
    enableTapToAdvance: true,
    enableHapticFeedback: true,
    onTourStart: () => {
      console.log('Responsive tour started')
    },
    onTourComplete: () => {
      console.log('Responsive tour completed')
      setIsManualTourActive(false)
    },
    onTourSkip: () => {
      console.log('Responsive tour skipped')
      setIsManualTourActive(false)
    },
    onStepChange: (step, stepData) => {
      console.log(`Step changed to ${step}:`, stepData)
    },
    onDeviceChange: (deviceInfo) => {
      console.log('Device info updated:', deviceInfo)
    }
  })

  // Example using the responsive tour config hook
  const { config: configTour, isLoading, error } = useResponsiveTourConfig('welcome-tour')

  const handleStartManualTour = () => {
    setIsManualTourActive(true)
    responsiveTour.startTour()
  }

  const handleStopManualTour = () => {
    setIsManualTourActive(false)
    responsiveTour.stopTour()
  }

  return (
    <div className="responsive-tour-example p-6 space-y-6">
      <Card data-tour="welcome-header">
        <CardHeader>
          <CardTitle>Ejemplo de Tour Responsivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Esta página demuestra cómo funciona el sistema de tours responsivo de Postia SaaS.
            El tour se adapta automáticamente a tu dispositivo y ofrece diferentes experiencias
            según el tamaño de pantalla y capacidades táctiles.
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleStartManualTour}
              disabled={responsiveTour.isActive}
            >
              Iniciar Tour Responsivo
            </Button>
            
            {responsiveTour.isActive && (
              <Button 
                variant="outline"
                onClick={handleStopManualTour}
              >
                Detener Tour
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-tour="responsive-features">
        <CardHeader>
          <CardTitle>Características Responsivas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Adaptación de Contenido</h4>
              <p className="text-sm text-muted-foreground">
                Los títulos y descripciones se adaptan según el tamaño de pantalla.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Layout Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                El diseño cambia automáticamente entre overlay, bottom-sheet y fullscreen.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Controles Adaptativos</h4>
              <p className="text-sm text-muted-foreground">
                Los controles se optimizan para cada tipo de dispositivo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-tour="touch-gestures">
        <CardHeader>
          <CardTitle>Gestos Táctiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                👆
              </div>
              <div>
                <p className="font-medium">Toca para avanzar</p>
                <p className="text-sm text-muted-foreground">En móviles, toca cualquier parte para continuar</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                👈
              </div>
              <div>
                <p className="font-medium">Desliza para navegar</p>
                <p className="text-sm text-muted-foreground">Desliza horizontalmente entre pasos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                📳
              </div>
              <div>
                <p className="font-medium">Retroalimentación háptica</p>
                <p className="text-sm text-muted-foreground">Vibración sutil para confirmar acciones</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-tour="accessibility-features">
        <CardHeader>
          <CardTitle>Características de Accesibilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Lectores de Pantalla</h4>
              <p className="text-sm text-muted-foreground">
                Soporte completo para NVDA, JAWS y VoiceOver.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Navegación por Teclado</h4>
              <p className="text-sm text-muted-foreground">
                Controla el tour completamente con el teclado.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Alto Contraste</h4>
              <p className="text-sm text-muted-foreground">
                Adaptación automática a preferencias de contraste.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Movimiento Reducido</h4>
              <p className="text-sm text-muted-foreground">
                Respeta las preferencias de movimiento reducido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Information Display */}
      {responsiveTour.deviceInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Tipo</p>
                <p className="text-muted-foreground">{responsiveTour.deviceInfo.deviceType}</p>
              </div>
              <div>
                <p className="font-medium">Orientación</p>
                <p className="text-muted-foreground">{responsiveTour.deviceInfo.orientation}</p>
              </div>
              <div>
                <p className="font-medium">Táctil</p>
                <p className="text-muted-foreground">{responsiveTour.deviceInfo.touchCapable ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <p className="font-medium">Layout Óptimo</p>
                <p className="text-muted-foreground">{responsiveTour.optimalLayout}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tour Status */}
      {responsiveTour.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Estado del Tour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Paso {responsiveTour.currentStep} de {responsiveTour.totalSteps}</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(responsiveTour.currentStep / responsiveTour.totalSteps) * 100}%` 
                  }}
                />
              </div>
              {responsiveTour.stepContent && (
                <div className="mt-4">
                  <h4 className="font-semibold">{responsiveTour.stepContent.title}</h4>
                  <p className="text-sm text-muted-foreground">{responsiveTour.stepContent.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsive Tour Controller */}
      {isManualTourActive && (
        <ResponsiveTourController
          tourId="responsive-example-tour"
          steps={exampleSteps}
          onTourComplete={() => setIsManualTourActive(false)}
          onTourSkip={() => setIsManualTourActive(false)}
        />
      )}

      {/* Config-based tour example */}
      {configTour && !isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Tour desde Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Este tour se carga desde un archivo de configuración JSON.
            </p>
            <ResponsiveTourController
              tourId={configTour.tourId}
              steps={configTour.steps}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error de Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ResponsiveTourExample