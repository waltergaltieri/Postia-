"use client"

import * as React from "react"
import { 
  Check, 
  Minus, 
  Trash2, 
  Download, 
  Share2, 
  Copy, 
  Eye, 
  Calendar,
  Archive,
  Star,
  Tag,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Types for bulk selection
export interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant?: "default" | "destructive" | "secondary" | "success"
  shortcut?: string
  requiresConfirmation?: boolean
  confirmationMessage?: string
  disabled?: boolean
}

export interface BulkSelectionSystemProps {
  selectedItems: string[]
  totalItems: number
  onSelectionChange: (selectedIds: string[]) => void
  onBulkAction: (actionId: string, selectedIds: string[]) => void
  actions?: BulkAction[]
  className?: string
  showKeyboardShortcuts?: boolean
}

// Default bulk actions
const defaultBulkActions: BulkAction[] = [
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
    confirmationMessage: '¿Estás seguro de que quieres eliminar los elementos seleccionados?'
  }
]

// Custom checkbox component with elegant styling
interface SelectionCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function SelectionCheckbox({ 
  checked, 
  indeterminate = false, 
  onChange, 
  disabled = false,
  className,
  size = 'md'
}: SelectionCheckboxProps) {
  const checkboxRef = React.useRef<HTMLInputElement>(null)
  
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-label="Seleccionar elemento"
      />
      
      <div
        className={cn(
          "relative flex items-center justify-center rounded-md border-2 transition-all duration-200 cursor-pointer",
          sizeClasses[size],
          checked || indeterminate
            ? "bg-primary-600 border-primary-600 text-white shadow-primary/20 shadow-md"
            : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-primary-400 hover:shadow-sm",
          disabled && "opacity-50 cursor-not-allowed",
          "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
        )}
        onClick={() => !disabled && onChange(!checked)}
      >
        {checked && !indeterminate && (
          <Check className={cn(
            "transition-all duration-200 transform scale-100",
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
          )} />
        )}
        
        {indeterminate && (
          <Minus className={cn(
            "transition-all duration-200 transform scale-100",
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
          )} />
        )}
      </div>
    </div>
  )
}

// Confirmation dialog component
interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default"
}: ConfirmationDialogProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            variant === "destructive" 
              ? "bg-error-100 dark:bg-error-900/30 text-error-600"
              : "bg-primary-100 dark:bg-primary-900/30 text-primary-600"
          )}>
            {variant === "destructive" ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Keyboard shortcuts hook
function useKeyboardShortcuts(
  actions: BulkAction[],
  selectedItems: string[],
  onBulkAction: (actionId: string, selectedIds: string[]) => void
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if there are selected items
      if (selectedItems.length === 0) return
      
      // Find matching action by shortcut
      const action = actions.find(action => {
        if (!action.shortcut) return false
        
        const shortcut = action.shortcut.toLowerCase()
        const key = event.key.toLowerCase()
        
        // Handle different shortcut formats
        if (shortcut.includes('ctrl+') && !event.ctrlKey) return false
        if (shortcut.includes('shift+') && !event.shiftKey) return false
        if (shortcut.includes('alt+') && !event.altKey) return false
        
        // Extract the main key
        const mainKey = shortcut.split('+').pop()
        
        return key === mainKey || 
               (mainKey === 'delete' && key === 'delete') ||
               (mainKey === 'a' && key === 'a') ||
               (mainKey === 's' && key === 's') ||
               (mainKey === 'd' && key === 'd')
      })
      
      if (action && !action.disabled) {
        event.preventDefault()
        onBulkAction(action.id, selectedItems)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [actions, selectedItems, onBulkAction])
}

// Main bulk selection system component
export function BulkSelectionSystem({
  selectedItems,
  totalItems,
  onSelectionChange,
  onBulkAction,
  actions = defaultBulkActions,
  className,
  showKeyboardShortcuts = true
}: BulkSelectionSystemProps) {
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    isOpen: boolean
    action?: BulkAction
  }>({ isOpen: false })
  
  // Selection state calculations
  const isAllSelected = selectedItems.length === totalItems && totalItems > 0
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems
  const hasSelection = selectedItems.length > 0
  
  // Keyboard shortcuts
  useKeyboardShortcuts(actions, selectedItems, handleBulkAction)
  
  // Handle select all/none
  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      // This would need to be implemented by the parent component
      // For now, we'll just clear the selection
      onSelectionChange([])
    }
  }
  
  // Handle bulk action with confirmation
  function handleBulkAction(actionId: string, selectedIds: string[]) {
    const action = actions.find(a => a.id === actionId)
    
    if (!action || action.disabled) return
    
    if (action.requiresConfirmation) {
      setConfirmationDialog({
        isOpen: true,
        action
      })
    } else {
      onBulkAction(actionId, selectedIds)
    }
  }
  
  // Handle confirmed action
  const handleConfirmedAction = () => {
    if (confirmationDialog.action) {
      onBulkAction(confirmationDialog.action.id, selectedItems)
    }
  }
  
  if (!hasSelection) return null
  
  return (
    <>
      <div className={cn(
        "flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg transition-all duration-300 animate-slide-in-from-top",
        className
      )}>
        {/* Selection indicator */}
        <div className="flex items-center gap-3">
          <SelectionCheckbox
            checked={isAllSelected}
            indeterminate={isPartiallySelected}
            onChange={handleSelectAll}
            size="md"
          />
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 font-medium">
              {selectedItems.length} de {totalItems} seleccionados
            </Badge>
            
            {showKeyboardShortcuts && (
              <Badge variant="outline" className="px-2 py-1 text-xs text-muted-foreground">
                Usa atajos de teclado
              </Badge>
            )}
          </div>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Bulk actions */}
        <div className="flex items-center gap-2 flex-1">
          {actions.slice(0, 5).map((action) => {
            const ActionIcon = action.icon
            
            return (
              <Button
                key={action.id}
                size="sm"
                variant={action.variant || "outline"}
                onClick={() => handleBulkAction(action.id, selectedItems)}
                disabled={action.disabled}
                className={cn(
                  "text-xs gap-2 transition-all duration-200 hover:scale-105",
                  action.variant === "destructive" && "hover:shadow-error/20 hover:shadow-md"
                )}
                title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
              >
                <ActionIcon className="w-3.5 h-3.5" />
                {action.label}
                {action.shortcut && showKeyboardShortcuts && (
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs ml-1">
                    {action.shortcut}
                  </Badge>
                )}
              </Button>
            )
          })}
          
          {/* More actions dropdown */}
          {actions.length > 5 && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <MoreHorizontal className="w-3.5 h-3.5 mr-1" />
              Más ({actions.length - 5})
            </Button>
          )}
        </div>
        
        {/* Clear selection */}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSelectionChange([])}
          className="text-xs text-muted-foreground hover:text-foreground ml-auto"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Cancelar
        </Button>
      </div>
      
      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false })}
        onConfirm={handleConfirmedAction}
        title={`${confirmationDialog.action?.label} elementos`}
        message={
          confirmationDialog.action?.confirmationMessage || 
          `¿Estás seguro de que quieres ${confirmationDialog.action?.label.toLowerCase()} ${selectedItems.length} elementos?`
        }
        variant={confirmationDialog.action?.variant === "destructive" ? "destructive" : "default"}
        confirmLabel={confirmationDialog.action?.label || "Confirmar"}
      />
    </>
  )
}

// Export individual components for flexibility
export { SelectionCheckbox, ConfirmationDialog }