'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Play, Square, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTour } from './tour-provider'
import { useTourBranding, useBrandedTourContent } from '@/hooks/use-tour-branding'
import { useNavigation } from '@/components/navigation/navigation-context'

interface BrandedTourDemoProps {
  className?: string
}

export default function BrandedTourDemo({ className }: BrandedTourDemoProps) {
  const { startTour, stopTour, isActive, currentTour } = useTour()
  const { currentClient } = useNavigation()
  const { 
    currentBranding, 
    isBrandingApplied, 
    shouldUseBranding 
  } = useTourBranding({
    autoApplyBranding: true,
    enableBrandedContent: true,
    enableBrandedMessages: true
  })
  
  const {
    getBrandedTitle,
    getBrandedDescription,
    getBrandedMessage,
    brandedMessages
  } = useBrandedTourContent()

  const [selectedDemo, setSelectedDemo] = useState<string>('welcome')

  const demoTours = [
    {
      id: 'welcome-tour',
      name: 'Tour de Bienvenida',
      description: 'Tour básico de introducción a la plataforma',
      category: 'onboarding',
      supportsBranding: true
    },
    {
      id: 'content-generation-tour',
      name: 'Generación de Contenido',
      description: 'Aprende a crear contenido con IA',
      category: 'feature',
      supportsBranding: true
    },
    {
      id: 'campaign-management-tour',
      name: 'Gestión de Campañas',
      description: 'Maneja tus campañas de marketing',
      category: 'feature',
      supportsBranding: true
    }
  ]

  const handleStartTour = (tourId: string) => {
    setSelectedDemo(tourId)
    startTour(tourId)
  }

  const handleStopTour = () => {
    stopTour()
    setSelectedDemo('welcome')
  }

  const ClientBrandPreview = () => {
    if (!currentBranding) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Branding Activo</CardTitle>
          </div>
          <CardDescription>
            Configuración de marca aplicada a los tours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {currentBranding.logoUrl ? (
              <img 
                src={currentBranding.logoUrl} 
                alt={currentBranding.brandName}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentBranding.brandColors[0] }}
              >
                {currentBranding.brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {currentBranding.brandName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Cliente seleccionado
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Colores de Marca
            </h4>
            <div className="flex space-x-2">
              {currentBranding.brandColors.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {brandedMessages && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">
                Mensajes Personalizados
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Bienvenida:</strong> {brandedMessages.welcome}</p>
                <p><strong>Finalización:</strong> {brandedMessages.completion}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Badge 
              variant={isBrandingApplied ? "default" : "secondary"}
              className="text-xs"
            >
              {isBrandingApplied ? 'Branding Aplicado' : 'Branding Inactivo'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Demo de Tours con Branding
        </h2>
        <p className="text-muted-foreground">
          Experimenta cómo los tours se adaptan automáticamente al branding del cliente seleccionado
        </p>
      </div>

      <ClientBrandPreview />

      {/* Tour Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tours Disponibles</CardTitle>
          <CardDescription>
            Selecciona un tour para ver cómo se aplica el branding del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {demoTours.map((tour) => (
              <motion.div
                key={tour.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedDemo === tour.id && "ring-2 ring-primary",
                    !tour.supportsBranding && "opacity-60"
                  )}
                  onClick={() => setSelectedDemo(tour.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">
                          {getBrandedTitle(tour.name)}
                        </h3>
                        <Badge 
                          variant={tour.supportsBranding ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {tour.supportsBranding ? 'Con Branding' : 'Sin Branding'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getBrandedDescription(tour.description)}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="text-xs">
                          {tour.category}
                        </Badge>
                        {shouldUseBranding(tour.id) && (
                          <div className="flex space-x-1">
                            {currentBranding?.brandColors.slice(0, 3).map((color, index) => (
                              <div
                                key={index}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tour Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controles del Tour</CardTitle>
          <CardDescription>
            Inicia, detén o reinicia tours para ver el branding en acción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => handleStartTour(selectedDemo)}
              disabled={isActive}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Iniciar Tour</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleStopTour}
              disabled={!isActive}
              className="flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>Detener Tour</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                handleStopTour()
                setTimeout(() => handleStartTour(selectedDemo), 100)
              }}
              disabled={!isActive}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reiniciar</span>
            </Button>
          </div>

          {isActive && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  Tour activo: {demoTours.find(t => t.id === currentTour)?.name}
                </span>
              </div>
              {currentBranding && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aplicando branding de {currentBranding.brandName}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branding Information */}
      {!currentClient && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Sin Cliente Seleccionado
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Selecciona un cliente para ver cómo se aplica su branding a los tours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}