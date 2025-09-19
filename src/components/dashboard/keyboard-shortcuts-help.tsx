"use client"

import * as React from "react"
import { Keyboard, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type BulkAction } from "./bulk-selection-system"

interface KeyboardShortcutsHelpProps {
  actions: BulkAction[]
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ actions, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Filter actions that have shortcuts
  const actionsWithShortcuts = actions.filter(action => action.shortcut)
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">Atajos de Teclado</h3>
          </div>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-info-50 dark:bg-info-950/20 border border-info-200 dark:border-info-800 rounded-lg mb-4">
          <Info className="w-4 h-4 text-info-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-info-800 dark:text-info-200">
            Los atajos solo funcionan cuando tienes elementos seleccionados
          </p>
        </div>
        
        {/* Shortcuts list */}
        <div className="space-y-3">
          {actionsWithShortcuts.map((action) => {
            const ActionIcon = action.icon
            
            return (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    action.variant === "destructive" 
                      ? "bg-error-100 dark:bg-error-900/30 text-error-600"
                      : action.variant === "success"
                      ? "bg-success-100 dark:bg-success-900/30 text-success-600"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                  )}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
                
                <Badge variant="outline" className="font-mono text-xs">
                  {action.shortcut}
                </Badge>
              </div>
            )
          })}
        </div>
        
        {/* General shortcuts */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3 text-muted-foreground">Atajos Generales</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Seleccionar todo</span>
              <Badge variant="outline" className="font-mono text-xs">Ctrl+A</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Cancelar selección</span>
              <Badge variant="outline" className="font-mono text-xs">Esc</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Mostrar ayuda</span>
              <Badge variant="outline" className="font-mono text-xs">?</Badge>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={onClose}
            className="w-full"
          > <span>Entendido</span></Button>
        </div>
      </div>
    </div>
  )
}

// Hook to show keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = React.useState(false)
  
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show help with '?' key
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        setIsOpen(true)
      }
      
      // Close help with Escape
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
  
  return {
    isOpen,
    show: () => setIsOpen(true),
    hide: () => setIsOpen(false)
  }
}