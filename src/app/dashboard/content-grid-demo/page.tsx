"use client"

import * as React from "react"
import { ContentGrid, type ContentItem, type ContentGridFilters } from "@/components/dashboard/content-grid"
import { type BulkAction } from "@/components/dashboard/bulk-selection-system"
import { KeyboardShortcutsHelp, useKeyboardShortcutsHelp } from "@/components/dashboard/keyboard-shortcuts-help"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  Calendar, 
  Archive,
  Star,
  Tag,
  Keyboard
} from "lucide-react"

// Mock data generator
function generateMockContent(): ContentItem[] {
  const titles = [
    "Campaña de verano 2024",
    "Lanzamiento de producto",
    "Post motivacional lunes",
    "Promoción fin de semana",
    "Historia de cliente satisfecho",
    "Tips de productividad",
    "Detrás de cámaras",
    "Anuncio de evento",
    "Contenido educativo",
    "Celebración de hitos",
    "Tendencias del mercado",
    "Caso de éxito",
    "Infografía estadísticas",
    "Video testimonial",
    "Carrusel de productos"
  ]
  
  const descriptions = [
    "Contenido visual atractivo para aumentar el engagement en redes sociales",
    "Diseño premium que refleja la calidad de nuestros servicios",
    "Mensaje inspirador para comenzar la semana con energía",
    "Promoción especial con descuentos exclusivos para seguidores",
    "Historia real de transformación y éxito de nuestros clientes",
    "Consejos prácticos para mejorar la productividad diaria",
    "Mostramos el proceso creativo detrás de nuestros proyectos",
    "Invitación a nuestro próximo evento exclusivo",
    "Información valiosa para educar a nuestra audiencia",
    "Celebramos los logros alcanzados junto a nuestra comunidad"
  ]
  
  const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']
  const statuses = ['draft', 'pending', 'approved', 'published', 'error'] as const
  const contentTypes = ['image', 'video', 'text', 'carousel'] as const
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `content-${i + 1}`,
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    scheduledAt: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
    thumbnail: Math.random() > 0.3 ? `https://picsum.photos/400/300?random=${i}` : undefined,
    tags: ['marketing', 'social-media', 'campaign'].slice(0, Math.floor(Math.random() * 3) + 1)
  }))
}

export default function ContentGridDemoPage() {
  const [mockContent] = React.useState(() => generateMockContent())
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<ContentGridFilters>({
    search: '',
    status: [],
    contentType: [],
    platform: [],
    dateRange: {}
  })
  
  // Keyboard shortcuts help
  const keyboardHelp = useKeyboardShortcutsHelp()
  
  // Custom bulk actions for the demo
  const bulkActions: BulkAction[] = [
    {
      id: 'approve',
      label: 'Aprobar',
      icon: CheckCircle2,
      variant: 'success',
      shortcut: 'Ctrl+A'
    },
    {
      id: 'schedule',
      label: 'Programar',
      icon: Calendar,
      variant: 'default',
      shortcut: 'Ctrl+S'
    },
    {
      id: 'favorite',
      label: 'Favorito',
      icon: Star,
      variant: 'secondary',
      shortcut: 'Ctrl+F'
    },
    {
      id: 'tag',
      label: 'Etiquetar',
      icon: Tag,
      variant: 'secondary'
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: Copy,
      variant: 'secondary',
      shortcut: 'Ctrl+D'
    },
    {
      id: 'download',
      label: 'Descargar',
      icon: Download,
      variant: 'secondary',
      shortcut: 'Ctrl+Shift+D'
    },
    {
      id: 'share',
      label: 'Compartir',
      icon: Share2,
      variant: 'secondary'
    },
    {
      id: 'archive',
      label: 'Archivar',
      icon: Archive,
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      variant: 'destructive',
      shortcut: 'Delete',
      requiresConfirmation: true,
      confirmationMessage: '¿Estás seguro de que quieres eliminar los elementos seleccionados? Esta acción no se puede deshacer.'
    }
  ]
  
  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Action ${action} on item ${itemId}`)
    
    switch (action) {
      case 'view':
        alert(`Viewing content: ${itemId}`)
        break
      case 'edit':
        alert(`Editing content: ${itemId}`)
        break
      case 'delete':
        alert(`Deleting content: ${itemId}`)
        break
      default:
        alert(`Action ${action} on ${itemId}`)
    }
  }
  
  const handleBulkAction = (actionId: string, selectedIds: string[]) => {
    console.log(`Bulk action ${actionId} on items:`, selectedIds)
    
    // Simulate different actions
    switch (actionId) {
      case 'approve':
        alert(`✅ Aprobando ${selectedIds.length} elementos`)
        setSelectedItems([])
        break
      case 'schedule':
        alert(`📅 Programando ${selectedIds.length} elementos`)
        setSelectedItems([])
        break
      case 'favorite':
        alert(`⭐ Marcando como favoritos ${selectedIds.length} elementos`)
        break
      case 'tag':
        alert(`🏷️ Etiquetando ${selectedIds.length} elementos`)
        break
      case 'duplicate':
        alert(`📋 Duplicando ${selectedIds.length} elementos`)
        setSelectedItems([])
        break
      case 'download':
        alert(`💾 Descargando ${selectedIds.length} elementos`)
        break
      case 'share':
        alert(`🔗 Compartiendo ${selectedIds.length} elementos`)
        break
      case 'archive':
        alert(`📦 Archivando ${selectedIds.length} elementos`)
        setSelectedItems([])
        break
      case 'delete':
        alert(`🗑️ Eliminando ${selectedIds.length} elementos`)
        setSelectedItems([])
        break
      default:
        alert(`Acción ${actionId} en ${selectedIds.length} elementos`)
    }
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Content Grid Demo</h1>
          <p className="text-muted-foreground">
            Demostración del componente ContentGrid con layout masonry, lazy loading, filtros visuales y selección múltiple
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={keyboardHelp.show}
          className="gap-2"
        >
          <Keyboard className="w-4 h-4" />
          Atajos de Teclado
        </Button>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Instrucciones del Sistema de Selección Múltiple
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Selecciona elementos</strong> haciendo clic en los checkboxes de las tarjetas</li>
          <li>• <strong>Usa atajos de teclado</strong>: Ctrl+A (aprobar), Ctrl+S (programar), Ctrl+D (duplicar), Delete (eliminar)</li>
          <li>• <strong>Selección masiva</strong>: Usa el checkbox principal para seleccionar/deseleccionar todo</li>
          <li>• <strong>Confirmaciones</strong>: Las acciones destructivas requieren confirmación</li>
          <li>• <strong>Feedback visual</strong>: Los checkboxes tienen animaciones elegantes y estados intermedios</li>
          <li>• <strong>Ayuda</strong>: Presiona <Badge variant="outline" className="mx-1 px-1.5 py-0.5 text-xs">?</Badge> para ver todos los atajos disponibles</li>
        </ul>
      </div>
      
      {/* Content Grid */}
      <ContentGrid
        items={mockContent}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onItemAction={handleItemAction}
        onBulkAction={handleBulkAction}
        bulkActions={bulkActions}
        filters={filters}
        onFiltersChange={setFilters}
        layout="masonry"
        enableBulkSelection={true}
        showKeyboardShortcuts={true}
      />
      
      {/* Debug info */}
      <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Total items:</strong> {mockContent.length}</p>
          <p><strong>Selected items:</strong> {selectedItems.length}</p>
          <p><strong>Active filters:</strong> {JSON.stringify(filters, null, 2)}</p>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        actions={bulkActions}
        isOpen={keyboardHelp.isOpen}
        onClose={keyboardHelp.hide}
      />
    </div>
  )
}