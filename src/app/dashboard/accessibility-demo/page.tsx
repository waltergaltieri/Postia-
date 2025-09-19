"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContentGrid } from "@/components/dashboard/content-grid"
import { ContentCard } from "@/components/ui/content-card"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { AccessibilityAudit } from "@/components/dev/accessibility-audit"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  Keyboard,
  MousePointer,
  Volume2,
  Contrast,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"

// Mock data for testing
const mockContentItems = [
  {
    id: '1',
    title: 'Campaña de Verano 2024',
    description: 'Contenido promocional para la temporada de verano con ofertas especiales',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    contentType: 'image' as const,
    status: 'approved' as const,
    createdAt: new Date(),
    platform: 'instagram',
    tags: ['verano', 'promoción', 'ofertas']
  },
  {
    id: '2',
    title: 'Video Tutorial de Producto',
    description: 'Tutorial explicativo sobre las características principales del producto',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    contentType: 'video' as const,
    status: 'draft' as const,
    createdAt: new Date(),
    platform: 'youtube',
    tags: ['tutorial', 'producto', 'educativo']
  },
  {
    id: '3',
    title: 'Post de Blog Corporativo',
    description: 'Artículo sobre las últimas tendencias en marketing digital',
    contentType: 'text' as const,
    status: 'published' as const,
    createdAt: new Date(),
    platform: 'linkedin',
    tags: ['blog', 'marketing', 'tendencias']
  },
  {
    id: '4',
    title: 'Carrusel de Productos',
    description: 'Galería interactiva mostrando la nueva colección de productos',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    contentType: 'carousel' as const,
    status: 'pending' as const,
    createdAt: new Date(),
    platform: 'facebook',
    tags: ['productos', 'colección', 'interactivo']
  }
]

export default function AccessibilityDemoPage() {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [searchValue, setSearchValue] = React.useState('')
  const [showAudit, setShowAudit] = React.useState(false)

  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Action ${action} on item ${itemId}`)
  }

  const handleBulkAction = (actionId: string, selectedIds: string[]) => {
    console.log(`Bulk action ${actionId} on items:`, selectedIds)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Saltar al contenido principal
      </a>

      {/* Page Header */}
      <header>
        <h1 className="text-4xl font-bold mb-2">Demo de Accesibilidad</h1>
        <p className="text-lg text-muted-foreground">
          Demostración de características de accesibilidad WCAG 2.1 AA implementadas
        </p>
      </header>

      {/* Accessibility Features Overview */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-semibold mb-4">
          Características de Accesibilidad Implementadas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Keyboard className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Navegación por Teclado</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Soporte completo para navegación con Tab, Enter, Space y teclas de flecha
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Volume2 className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Lectores de Pantalla</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Etiquetas ARIA, texto alternativo y anuncios para tecnologías asistivas
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Contrast className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Alto Contraste</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Colores que cumplen WCAG AA con ratio de contraste 4.5:1 mínimo
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Objetivos Táctiles</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Botones y elementos interactivos de mínimo 44x44px
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Movimiento Reducido</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Respeta la preferencia prefers-reduced-motion del usuario
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-primary-600" aria-hidden="true" />
              <h3 className="font-medium">Carga Optimizada</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Lazy loading de imágenes y optimización automática WebP/AVIF
            </p>
          </Card>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <main id="main-content">
        <section aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-2xl font-semibold mb-4">
            Demo Interactivo
          </h2>

          {/* Form Example */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Formulario Accesible</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search-demo">Buscar contenido</Label>
                <Input
                  id="search-demo"
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  aria-describedby="search-help"
                  className="mt-1"
                />
                <p id="search-help" className="text-sm text-muted-foreground mt-1">
                  Usa palabras clave para filtrar el contenido
                </p>
              </div>

              <div>
                <Label htmlFor="category-select">Categoría</Label>
                <select
                  id="category-select"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
                  aria-describedby="category-help"
                  title="Seleccionar categoría de contenido"
                >
                  <option value="">Todas las categorías</option>
                  <option value="image">Imágenes</option>
                  <option value="video">Videos</option>
                  <option value="text">Texto</option>
                </select>
                <p id="category-help" className="text-sm text-muted-foreground mt-1">
                  Filtra por tipo de contenido
                </p>
              </div>
            </div>
          </Card>

          {/* Button Examples */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Botones Accesibles</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="default"
                announceOnClick="Acción principal ejecutada"
                aria-describedby="primary-btn-desc"
              >
                Botón Principal
              </Button>
              <p id="primary-btn-desc" className="sr-only">
                Ejecuta la acción principal del formulario
              </p>

              <Button
                variant="secondary"
                loading
                loadingText="Guardando..."
                aria-describedby="loading-btn-desc"
              >
                Guardar
              </Button>
              <p id="loading-btn-desc" className="sr-only">
                Guarda los cambios actuales
              </p>

              <Button
                variant="outline"
                size="sm"
                aria-label="Eliminar elemento seleccionado"
                announceOnClick="Elemento eliminado"
              >
                Eliminar
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Más opciones"
                aria-expanded={false}
                aria-haspopup="menu"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Status Indicators with Patterns */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Indicadores de Estado Accesibles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Los patrones visuales ayudan a usuarios con daltonismo a distinguir estados
            </p>
            <div className="flex flex-wrap gap-4">
              <Badge className="status-draft pattern">
                <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />
                Borrador
              </Badge>
              <Badge className="status-approved pattern">
                <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                Aprobado
              </Badge>
              <Badge className="status-error pattern">
                <Info className="w-3 h-3 mr-1" aria-hidden="true" />
                Error
              </Badge>
            </div>
          </Card>

          {/* Optimized Images Demo */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Imágenes Optimizadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Lazy Loading</h4>
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop"
                  alt="Imagen de demostración con lazy loading"
                  width={300}
                  height={200}
                  className="rounded-lg"
                  lazy={true}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Prioridad Alta</h4>
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop"
                  alt="Imagen de demostración con prioridad alta"
                  width={300}
                  height={200}
                  className="rounded-lg"
                  priority={true}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Con Fallback</h4>
                <OptimizedImage
                  src="https://invalid-url.com/image.jpg"
                  alt="Imagen con URL inválida para mostrar fallback"
                  width={300}
                  height={200}
                  className="rounded-lg"
                  fallback={
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center rounded-lg">
                      <span className="text-sm text-muted-foreground">Imagen no disponible</span>
                    </div>
                  }
                />
              </div>
            </div>
          </Card>

          {/* Content Grid Demo */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Grid de Contenido Accesible</h3>
            <ContentGrid
              items={mockContentItems}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onItemAction={handleItemAction}
              onBulkAction={handleBulkAction}
              enableBulkSelection={true}
              showKeyboardShortcuts={true}
              bulkActions={[
                {
                  id: 'publish',
                  label: 'Publicar',
                  icon: CheckCircle,
                  variant: 'default'
                },
                {
                  id: 'delete',
                  label: 'Eliminar',
                  icon: AlertTriangle,
                  variant: 'destructive'
                }
              ]}
            />
          </Card>
        </section>
      </main>

      {/* Accessibility Testing Tools */}
      <section aria-labelledby="testing-heading">
        <h2 id="testing-heading" className="text-2xl font-semibold mb-4">
          Herramientas de Testing
        </h2>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Auditoría de Accesibilidad</h3>
            <Button
              variant="outline"
              onClick={() => setShowAudit(!showAudit)}
              aria-expanded={showAudit}
              aria-controls="accessibility-audit"
            >
              {showAudit ? 'Ocultar' : 'Mostrar'} Auditoría
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Herramienta de desarrollo que analiza la página en tiempo real para detectar
            problemas de accesibilidad y proporcionar sugerencias de mejora.
          </p>

          {showAudit && (
            <div id="accessibility-audit">
              <AccessibilityAudit
                targetSelector="main"
                showOnlyInDev={false}
                className="relative bottom-auto right-auto w-full max-h-none"
              />
            </div>
          )}
        </Card>
      </section>

      {/* Live Region for Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-announcements"
      >
        {/* Screen reader announcements will appear here */}
      </div>

      {/* Development Accessibility Audit (only in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <AccessibilityAudit />
      )}
    </div>
  )
}