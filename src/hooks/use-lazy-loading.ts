"use client"

import * as React from "react"

interface UseLazyLoadingOptions<T> {
  items: T[]
  itemsPerPage?: number
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

interface UseLazyLoadingReturn<T> {
  visibleItems: T[]
  hasMore: boolean
  loading: boolean
  loadMore: () => void
  reset: () => void
  observerRef: React.RefObject<HTMLDivElement>
}

export function useLazyLoading<T>({
  items,
  itemsPerPage = 20,
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true
}: UseLazyLoadingOptions<T>): UseLazyLoadingReturn<T> {
  const [visibleItems, setVisibleItems] = React.useState<T[]>([])
  const [hasMore, setHasMore] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const observerRef = React.useRef<HTMLDivElement>(null)

  // Reset visible items when items array changes
  React.useEffect(() => {
    if (!enabled) {
      setVisibleItems(items)
      setHasMore(false)
      return
    }

    const initialItems = items.slice(0, itemsPerPage)
    setVisibleItems(initialItems)
    setHasMore(items.length > itemsPerPage)
  }, [items, itemsPerPage, enabled])

  // Load more items
  const loadMore = React.useCallback(() => {
    if (loading || !hasMore || !enabled) return

    setLoading(true)

    // Simulate network delay for better UX
    const delay = Math.random() * 200 + 100 // 100-300ms

    setTimeout(() => {
      setVisibleItems(prev => {
        const currentLength = prev.length
        const nextItems = items.slice(currentLength, currentLength + itemsPerPage)
        const newItems = [...prev, ...nextItems]
        
        setHasMore(newItems.length < items.length)
        setLoading(false)
        
        return newItems
      })
    }, delay)
  }, [items, itemsPerPage, loading, hasMore, enabled])

  // Reset to initial state
  const reset = React.useCallback(() => {
    if (!enabled) return
    
    const initialItems = items.slice(0, itemsPerPage)
    setVisibleItems(initialItems)
    setHasMore(items.length > itemsPerPage)
    setLoading(false)
  }, [items, itemsPerPage, enabled])

  // Intersection Observer for automatic loading
  React.useEffect(() => {
    if (!enabled || !observerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadMore()
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    const currentRef = observerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, loading, loadMore, threshold, rootMargin, enabled])

  return {
    visibleItems,
    hasMore,
    loading,
    loadMore,
    reset,
    observerRef
  }
}

// Hook for virtual scrolling (for very large lists)
interface UseVirtualScrollingOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface UseVirtualScrollingReturn {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
  scrollElementRef: React.RefObject<HTMLDivElement>
}

export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseLazyLoadingOptions<T> & UseVirtualScrollingOptions): UseVirtualScrollingReturn {
  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollElementRef = React.useRef<HTMLDivElement>(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  React.useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollTop(scrollElement.scrollTop)
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollElementRef
  }
}

// Hook for image preloading
interface UseImagePreloadingOptions {
  images: string[]
  priority?: boolean
  onProgress?: (loaded: number, total: number) => void
}

export function useImagePreloading({
  images,
  priority = false,
  onProgress
}: UseImagePreloadingOptions) {
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const preloadImages = React.useCallback(async () => {
    if (images.length === 0) return

    setLoading(true)
    setProgress(0)

    const loadPromises = images.map((src, index) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, src]))
          const newProgress = ((index + 1) / images.length) * 100
          setProgress(newProgress)
          onProgress?.(index + 1, images.length)
          resolve()
        }
        
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`)
          const newProgress = ((index + 1) / images.length) * 100
          setProgress(newProgress)
          onProgress?.(index + 1, images.length)
          resolve() // Don't reject, just continue
        }
        
        img.src = src
      })
    })

    try {
      await Promise.all(loadPromises)
    } finally {
      setLoading(false)
    }
  }, [images, onProgress])

  React.useEffect(() => {
    if (priority && images.length > 0) {
      preloadImages()
    }
  }, [images, priority, preloadImages])

  return {
    loadedImages,
    loading,
    progress,
    preloadImages
  }
}

// Hook for progressive image loading
export function useProgressiveImage(src: string, placeholderSrc?: string) {
  const [currentSrc, setCurrentSrc] = React.useState(placeholderSrc || src)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    if (!src) return

    setLoading(true)
    setError(false)

    const img = new Image()
    
    img.onload = () => {
      setCurrentSrc(src)
      setLoading(false)
    }
    
    img.onerror = () => {
      setError(true)
      setLoading(false)
    }
    
    img.src = src
  }, [src])

  return {
    src: currentSrc,
    loading,
    error
  }
}