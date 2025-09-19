"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Loader2,
  Sparkles,
  Share2,
  Trash2,
  Download
} from "lucide-react"

export default function ToastDemoPage() {
  const { 
    toast, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo,
    showContentGenerated,
    showContentPublished,
    showBulkActionComplete,
    showTokensConsumed,
    confirmDestructiveAction
  } = useToast()
  
  const [isGenerating, setIsGenerating] = useState(false)

  const simulateContentGeneration = async () => {
    setIsGenerating(true)
    const loadingId = toast.loading("Generando contenido con IA...")
    
    // Simulate API call
    setTimeout(() => {
      toast.dismiss(loadingId)
      setIsGenerating(false)
      showContentGenerated()
    }, 3000)
  }

  const simulatePromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve("Success!") : reject("Error occurred")
      }, 2000)
    })

    toast.promise(promise, {
      loading: "Procesando solicitud...",
      success: "¡Operación completada exitosamente!",
      error: "Hubo un error al procesar la solicitud"
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-neutral-900">
            Sistema de Toasts Elegante
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Notificaciones premium con animaciones suaves, acciones inline y diferentes tipos 
            para una experiencia de usuario profesional.
          </p>
        </div>

        {/* Basic Toast Types */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Tipos Básicos de Toast
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => <span>showSuccess("¡Éxito!", "Operación completada correctamente")}
              className="flex items-center gap-2 bg-success hover:bg-success/90"
            ></span><CheckCircle className="h-4 w-4" /> <span>Success</span></Button>
            
            <Button
              onClick={() => <span>showError("Error", "Algo salió mal, intenta nuevamente")}
              variant="destructive"
              className="flex items-center gap-2"
            ></span><XCircle className="h-4 w-4" /> <span>Error</span></Button>
            
            <Button
              onClick={() => <span>showWarning("Advertencia", "Revisa esta información importante")}
              className="flex items-center gap-2 bg-warning hover:bg-warning/90 text-white"
            ></span><AlertTriangle className="h-4 w-4" /> <span>Warning</span></Button>
            
            <Button
              onClick={() => <span>showInfo("Información", "Aquí tienes algunos datos útiles")}
              variant="outline"
              className="flex items-center gap-2"
            ></span><Info className="h-4 w-4" /> <span>Info</span></Button>
          </div>
        </Card>

        {/* Toast with Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Toasts con Acciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => <span>toast.success("Archivo descargado", {
                description: "El archivo se guardó en tu carpeta de descargas",
                action: {
                  label: "Abrir carpeta",
                  onClick: () => console.log("Opening downloads folder")
                }
              })}
              className="flex items-center gap-2"
            ></span><Download className="h-4 w-4" /> <span>Descarga con Acción</span></Button>
            
            <Button
              onClick={() => <span>toast.info("Contenido compartido", {
                description: "Se copió el enlace al portapapeles",
                action: {
                  label: "Ver enlace",
                  onClick: () => console.log("Show link")
                },
                cancel: {
                  label: "Deshacer",
                  onClick: () => console.log("Undo share")
                }
              })}
              variant="outline"
              className="flex items-center gap-2"
            ></span><Share2 className="h-4 w-4" /> <span>Compartir con Cancelar</span></Button>
          </div>
        </Card>

        {/* Marketing Agency Specific Toasts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Casos de Uso para Agencias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={simulateContentGeneration}
              disabled={isGenerating}
              className="flex items-center gap-2"
            > <span>{isGenerating ? (</span><Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generar Contenido
            </Button>
            
            <Button
              onClick={() => <span>showContentPublished()}
              className="flex items-center gap-2 bg-success hover:bg-success/90"
            ></span><Share2 className="h-4 w-4" /> <span>Publicar Contenido</span></Button>
            
            <Button
              onClick={() => <span>showBulkActionComplete(15, "Programación en lote")}
              variant="outline"
              className="flex items-center gap-2"
            ></span><CheckCircle className="h-4 w-4" /> <span>Acción en Lote</span></Button>
            
            <Button
              onClick={() => <span>showTokensConsumed(250)}
              variant="outline"
              className="flex items-center gap-2"
            ></span><Info className="h-4 w-4" /> <span>Tokens Consumidos</span></Button>
            
            <Button
              onClick={() => <span>confirmDestructiveAction(
                "¿Eliminar campaña?",
                "Esta acción no se puede deshacer. Se eliminarán todos los contenidos asociados.",
                () => console.log("Campaign deleted")
              )}
              variant="destructive"
              className="flex items-center gap-2"
            ></span><Trash2 className="h-4 w-4" /> <span>Acción Destructiva</span></Button>
            
            <Button
              onClick={simulatePromiseToast}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4" /> <span>Promise Toast</span></Button>
          </div>
        </Card>

        {/* Advanced Features */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Funciones Avanzadas</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => <span>{
                  const id = toast.info("Toast persistente", {
                    description: "Este toast no se cierra automáticamente",
                    duration: Infinity,
                    action: {
                      label: "Cerrar manualmente",
                      onClick: () => toast.dismiss(id)
                    }
                  })
                }}
                variant="outline"
              >
                Toast Persistente</span></Button>
              
              <Button
                onClick={() => <span>{
                  // Create multiple toasts
                  toast.success("Toast 1")
                  setTimeout(() => toast.info("Toast 2"), 500)
                  setTimeout(() => toast.warning("Toast 3"), 1000)
                }}
                variant="outline"
              >
                Múltiples Toasts</span></Button>
              
              <Button
                onClick={() => <span>toast.dismissAll()}
                variant="destructive"
              >
                Cerrar Todos</span></Button>
            </div>
            
            <Separator />
            
            <div className="text-sm text-neutral-600 space-y-2">
              <p><strong>Características del sistema:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Animaciones suaves con Framer Motion</li>
                <li>Soporte para acciones inline y botones de cancelar</li>
                <li>Diferentes variantes visuales (success, error, warning, info)</li>
                <li>Toasts persistentes y con duración personalizable</li>
                <li>Integración con promesas para operaciones asíncronas</li>
                <li>Diseño premium con backdrop blur y sombras elegantes</li>
                <li>Casos de uso específicos para agencias de marketing</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}