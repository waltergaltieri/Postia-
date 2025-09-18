"use client"

import { toast as sonnerToast } from "sonner"
import { CustomToastProps } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface ToastOptions extends Omit<CustomToastProps, 'title'> {
  id?: string | number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

interface ToastService {
  success: (title: string, options?: ToastOptions) => string | number
  error: (title: string, options?: ToastOptions) => string | number
  warning: (title: string, options?: ToastOptions) => string | number
  info: (title: string, options?: ToastOptions) => string | number
  loading: (title: string, options?: ToastOptions) => string | number
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => Promise<T>
  dismiss: (id?: string | number) => void
  dismissAll: () => void
}

// Enhanced toast functions with premium styling and animations
const createToast = (variant: 'success' | 'error' | 'warning' | 'info') => {
  return (title: string, options: ToastOptions = {}) => {
    const { 
      description, 
      action, 
      cancel, 
      duration = 5000, 
      dismissible = true,
      id,
      position = 'top-right',
      ...rest 
    } = options

    // Use the built-in sonner toast with custom styling
    return sonnerToast(title, {
      description,
      duration,
      position,
      id,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined,
      cancel: cancel ? {
        label: cancel.label,
        onClick: cancel.onClick
      } : undefined,
      className: cn(
        "border-l-4",
        variant === 'success' && 'border-l-success bg-success/5',
        variant === 'error' && 'border-l-error bg-error/5',
        variant === 'warning' && 'border-l-warning bg-warning/5',
        variant === 'info' && 'border-l-info bg-info/5'
      ),
      ...rest
    })
  }
}

// Create toast service
export const toast: ToastService = {
  success: createToast('success'),
  error: createToast('error'),
  warning: createToast('warning'),
  info: createToast('info'),
  
  loading: (title: string, options: ToastOptions = {}) => {
    return sonnerToast.loading(title, {
      duration: Infinity,
      ...options
    })
  },

  promise: async <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },

  dismiss: (id?: string | number) => {
    if (id) {
      sonnerToast.dismiss(id)
    } else {
      sonnerToast.dismiss()
    }
  },

  dismissAll: () => {
    sonnerToast.dismiss()
  }
}

// Hook for using toast in components
export const useToast = () => {
  return {
    toast,
    // Convenience methods for common patterns
    showSuccess: (message: string, description?: string) => 
      toast.success(message, { description }),
    
    showError: (message: string, description?: string) => 
      toast.error(message, { description }),
    
    showWarning: (message: string, description?: string) => 
      toast.warning(message, { description }),
    
    showInfo: (message: string, description?: string) => 
      toast.info(message, { description }),
    
    showLoading: (message: string) => 
      toast.loading(message),
    
    // Common use cases for marketing agencies
    showContentGenerated: () => 
      toast.success("Contenido generado exitosamente", {
        description: "El contenido está listo para revisión",
        action: {
          label: "Ver contenido",
          onClick: () => console.log("Navigate to content")
        }
      }),
    
    showContentPublished: () => 
      toast.success("Contenido publicado", {
        description: "Tu publicación está ahora en vivo",
        action: {
          label: "Ver publicación",
          onClick: () => console.log("Open published content")
        }
      }),
    
    showBulkActionComplete: (count: number, action: string) => 
      toast.success(`${action} completado`, {
        description: `${count} elementos procesados exitosamente`,
        action: {
          label: "Ver resultados",
          onClick: () => console.log("Show bulk action results")
        }
      }),
    
    showTokensConsumed: (tokens: number) => 
      toast.info("Tokens consumidos", {
        description: `Se utilizaron ${tokens} tokens para esta generación`,
        duration: 3000
      }),
    
    confirmDestructiveAction: (
      title: string, 
      description: string, 
      onConfirm: () => void
    ) => 
      toast.warning(title, {
        description,
        duration: 10000,
        action: {
          label: "Confirmar",
          onClick: onConfirm
        },
        cancel: {
          label: "Cancelar",
          onClick: () => {}
        }
      })
  }
}