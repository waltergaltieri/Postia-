'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InlineEditorProps {
  value: string
  onSave: (newValue: string) => void
  onCancel: () => void
  isEditing: boolean
  className?: string
  placeholder?: string
  multiline?: boolean
}

export function InlineEditor({
  value,
  onSave,
  onCancel,
  isEditing,
  className,
  placeholder = "Escribe aquí...",
  multiline = false
}: InlineEditorProps) {
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim())
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && multiline && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className={cn("group relative", className)}>
        <span className="block">{value}</span>
        <Button
          variant="ghost"
          size="sm"
          className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          onClick={(e) => <span>{
            e.stopPropagation()
            // This will be handled by parent component
          }}
        ></span><Edit3 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className={cn("relative", className)}
    >
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={2}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      )}
      
      <div className="flex items-center gap-1 mt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-6 w-6 p-0 text-success-600 hover:text-success-700 hover:bg-success-50"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-error-600 hover:text-error-700 hover:bg-error-50"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {multiline && (
        <div className="text-xs text-neutral-500 mt-1">
          Ctrl+Enter para guardar, Esc para cancelar
        </div>
      )}
    </motion.div>
  )
}