'use client'

import { useEffect, useRef, useState } from 'react'
import { usabilityTesting, UserAction } from '@/lib/usability-testing'

interface UseUserTestingRecorderOptions {
  sessionId?: string
  enabled?: boolean
  trackClicks?: boolean
  trackScrolls?: boolean
  trackHovers?: boolean
  trackKeystrokes?: boolean
  trackNavigation?: boolean
}

export function useUserTestingRecorder({
  sessionId,
  enabled = false,
  trackClicks = true,
  trackScrolls = true,
  trackHovers = false,
  trackKeystrokes = true,
  trackNavigation = true
}: UseUserTestingRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(enabled)
  const [recordedActions, setRecordedActions] = useState<UserAction[]>([])
  const lastScrollTime = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  // Record a user action
  const recordAction = (action: Omit<UserAction, 'timestamp' | 'page'>) => {
    if (!isRecording || !sessionId) return

    const userAction: UserAction = {
      ...action,
      timestamp: new Date(),
      page: window.location.pathname
    }

    // Add to local state
    setRecordedActions(prev => [...prev, userAction])

    // Send to usability testing manager
    usabilityTesting.recordUserAction(sessionId, userAction)
  }

  // Get element selector for an element
  const getElementSelector = (element: Element): string => {
    if (element.id) {
      return `#${element.id}`
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0)
      if (classes.length > 0) {
        return `.${classes[0]}`
      }
    }

    const tagName = element.tagName.toLowerCase()
    const parent = element.parentElement

    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(element)
        return `${getElementSelector(parent)} > ${tagName}:nth-child(${index + 1})`
      }
      return `${getElementSelector(parent)} > ${tagName}`
    }

    return tagName
  }

  // Click tracking
  useEffect(() => {
    if (!isRecording || !trackClicks) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target) return

      recordAction({
        action: 'click',
        element: getElementSelector(target),
        coordinates: { x: event.clientX, y: event.clientY }
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isRecording, trackClicks, sessionId])

  // Scroll tracking (throttled)
  useEffect(() => {
    if (!isRecording || !trackScrolls) return

    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime.current < 100) return // Throttle to 100ms

      lastScrollTime.current = now

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      // Set new timeout to record scroll end
      scrollTimeout.current = setTimeout(() => {
        recordAction({
          action: 'scroll',
          element: 'window',
          coordinates: { x: window.scrollX, y: window.scrollY }
        })
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [isRecording, trackScrolls, sessionId])

  // Hover tracking (throttled)
  useEffect(() => {
    if (!isRecording || !trackHovers) return

    let hoverTimeout: NodeJS.Timeout

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target) return

      // Clear existing timeout
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }

      // Only record if hover lasts more than 500ms
      hoverTimeout = setTimeout(() => {
        recordAction({
          action: 'hover',
          element: getElementSelector(target),
          coordinates: { x: event.clientX, y: event.clientY }
        })
      }, 500)
    }

    const handleMouseOut = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [isRecording, trackHovers, sessionId])

  // Keystroke tracking
  useEffect(() => {
    if (!isRecording || !trackKeystrokes) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element
      if (!target) return

      // Don't record sensitive inputs (passwords, etc.)
      if (target.tagName === 'INPUT') {
        const input = target as HTMLInputElement
        if (input.type === 'password' || input.type === 'email') {
          return
        }
      }

      recordAction({
        action: 'type',
        element: getElementSelector(target),
        value: event.key.length === 1 ? event.key : `[${event.key}]`
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, trackKeystrokes, sessionId])

  // Navigation tracking
  useEffect(() => {
    if (!isRecording || !trackNavigation) return

    const handleNavigation = () => {
      recordAction({
        action: 'navigate',
        element: 'window'
      })
    }

    // Track both popstate (back/forward) and pushstate/replacestate
    window.addEventListener('popstate', handleNavigation)

    // Monkey patch history methods to track programmatic navigation
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      handleNavigation()
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      handleNavigation()
    }

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [isRecording, trackNavigation, sessionId])

  // Control functions
  const startRecording = () => setIsRecording(true)
  const stopRecording = () => setIsRecording(false)
  const clearRecording = () => setRecordedActions([])

  return {
    isRecording,
    recordedActions,
    startRecording,
    stopRecording,
    clearRecording,
    recordAction
  }
}

// Hook for automatic session recording
export function useAutoSessionRecording(sessionId?: string) {
  const recorder = useUserTestingRecorder({
    sessionId,
    enabled: !!sessionId,
    trackClicks: true,
    trackScrolls: true,
    trackHovers: false, // Disabled by default to reduce noise
    trackKeystrokes: true,
    trackNavigation: true
  })

  // Auto-start recording when sessionId is provided
  useEffect(() => {
    if (sessionId && !recorder.isRecording) {
      recorder.startRecording()
    } else if (!sessionId && recorder.isRecording) {
      recorder.stopRecording()
    }
  }, [sessionId, recorder.isRecording])

  return recorder
}

// Hook for heatmap data collection
export function useHeatmapRecording(enabled = false) {
  const [heatmapData, setHeatmapData] = useState<Array<{
    x: number
    y: number
    timestamp: Date
    type: 'click' | 'hover'
  }>>([])

  useEffect(() => {
    if (!enabled) return

    const handleClick = (event: MouseEvent) => {
      setHeatmapData(prev => [...prev, {
        x: event.clientX,
        y: event.clientY,
        timestamp: new Date(),
        type: 'click'
      }])
    }

    const handleMouseMove = (event: MouseEvent) => {
      // Sample mouse moves (every 100ms) to avoid too much data
      if (Math.random() < 0.01) { // 1% sampling rate
        setHeatmapData(prev => [...prev, {
          x: event.clientX,
          y: event.clientY,
          timestamp: new Date(),
          type: 'hover'
        }])
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enabled])

  const clearHeatmapData = () => setHeatmapData([])

  return {
    heatmapData,
    clearHeatmapData
  }
}