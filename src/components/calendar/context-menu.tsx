'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  Copy, 
  Trash2, 
  Calendar, 
  Clock, 
  Eye, 
  Share2, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from './calendar-view'
import { cn } from '@/lib/utils'

interface ContextMenuProps {
  event: CalendarEvent
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onChangeStatus: (status: CalendarEvent['status']) => void
  onSchedule: () => void
  onPreview: () => void
  onShare: () => void
  position: { x: number; y: number }
}

export function ContextMenu({
  event,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onChangeStatus,
  onSchedule,
  onPreview,
  onShare,
  position
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const statusActions = [
    {
      status: 'draft' as const,
      label: 'Marcar como borrador',
      icon: Edit3,
      color: 'text-neutral-600'
    },
    {
      status: 'pending' as const,
      label: 'Enviar para revisión',
      icon: AlertCircle,
      color: 'text-warning-600'
    },
    {
      status: 'approved' as const,
      label: 'Aprobar',
      icon: CheckCircle,
      color: 'text-success-600'
    },
    {
      status: 'published' as const,
      label: 'Publicar',
      icon: Send,
      color: 'text-primary-600'
    },
    {
      status: 'error' as const,
      label: 'Marcar con error',
      icon: XCircle,
      color: 'text-error-600'
    }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Quick Actions */}
        <div className="px-3 py-1">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Acciones Rápidas
          </div>
          
          <MenuItem
            icon={Edit3}
            label="Editar"
            onClick={() => {
              onEdit()
              onClose()
            }}
          />
          
          <MenuItem
            icon={Copy}
            label="Duplicar"
            onClick={() => {
              onDuplicate()
              onClose()
            }}
          />
          
          <MenuItem
            icon={Calendar}
            label="Reprogramar"
            onClick={() => {
              onSchedule()
              onClose()
            }}
          />
          
          <MenuItem
            icon={Eye}
            label="Vista previa"
            onClick={() => {
              onPreview()
              onClose()
            }}
          />
          
          <MenuItem
            icon={Share2}
            label="Compartir"
            onClick={() => {
              onShare()
              onClose()
            }}
          />
        </div>

        <div className="border-t border-neutral-200 my-2" />

        {/* Status Actions */}
        <div className="px-3 py-1">
          <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Cambiar Estado
          </div>
          
          {statusActions
            .filter(action => action.status !== event.status)
            .map((action) => (
              <MenuItem
                key={action.status}
                icon={action.icon}
                label={action.label}
                className={action.color}
                onClick={() => {
                  onChangeStatus(action.status)
                  onClose()
                }}
              />
            ))}
        </div>

        <div className="border-t border-neutral-200 my-2" />

        {/* Danger Zone */}
        <div className="px-3 py-1">
          <MenuItem
            icon={Trash2}
            label="Eliminar"
            className="text-error-600 hover:bg-error-50"
            onClick={() => {
              onDelete()
              onClose()
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  className?: string
}

function MenuItem({ icon: Icon, label, onClick, className }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-neutral-50 transition-colors text-left",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

// Quick Action Button Component
interface QuickActionButtonProps {
  event: CalendarEvent
  onContextMenu: (e: React.MouseEvent) => void
  className?: string
}

export function QuickActionButton({ event, onContextMenu, className }: QuickActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onContextMenu}
      className={cn(
        "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
    >
      <MoreHorizontal className="h-3 w-3" />
    </Button>
  )
}