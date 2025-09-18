'use client'

import React, { useEffect, useRef } from 'react'
import { createLiveRegion, removeLiveRegion, AnnouncementPriority } from '@/lib/accessibility'

interface TourLiveRegionProps {
  id: string
  priority?: AnnouncementPriority
  message?: string
  clearAfter?: number
}

/**
 * Dedicated live region component for tour announcements
 * Ensures proper screen reader support with automatic cleanup
 */
export function TourLiveRegion({ 
  id, 
  priority = 'polite', 
  message, 
  clearAfter = 3000 
}: TourLiveRegionProps) {
  const liveRegionRef = useRef<HTMLElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create live region on mount
  useEffect(() => {
    liveRegionRef.current = createLiveRegion(id, priority)
    
    return () => {
      removeLiveRegion(id)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [id, priority])

  // Update message and handle auto-clear
  useEffect(() => {
    if (message && liveRegionRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set the message
      liveRegionRef.current.textContent = message

      // Auto-clear after specified time
      if (clearAfter > 0) {
        timeoutRef.current = setTimeout(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = ''
          }
        }, clearAfter)
      }
    }
  }, [message, clearAfter])

  // This component doesn't render anything visible
  return null
}

/**
 * Hook for managing tour live region announcements
 */
export function useTourLiveRegion(id: string, priority: AnnouncementPriority = 'polite') {
  const [message, setMessage] = React.useState<string>('')

  const announce = React.useCallback((text: string) => {
    setMessage(text)
  }, [])

  const clear = React.useCallback(() => {
    setMessage('')
  }, [])

  return {
    announce,
    clear,
    LiveRegion: () => (
      <TourLiveRegion 
        id={id} 
        priority={priority} 
        message={message}
      />
    )
  }
}