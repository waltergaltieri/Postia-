"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Loader2, ImageIcon } from "lucide-react"
import { performanceMonitor } from "@/lib/performance"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: "blur" | "empty"
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
  lazy?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  sizes,
  fill = false,
  objectFit = "cover",
  onLoad,
  onError,
  fallback,
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)
  const [isInView, setIsInView] = React.useState(!lazy || priority)
  const imgRef = React.useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    if (!lazy || priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "50px", // Start loading 50px before the image enters viewport
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  // Performance tracking
  const imageTracker = React.useMemo(() => 
    performanceMonitor.trackImageLoad(src), 
    [src]
  )

  const handleLoad = () => {
    setIsLoading(false)
    imageTracker.onLoad()
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    imageTracker.onError()
    onError?.()
  }

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? "100vw"
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  )

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  const defaultBlurDataURL = blurDataURL || (
    width && height ? generateBlurDataURL(width, height) : undefined
  )

  return (
    <div 
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        fill && "w-full h-full",
        className
      )}
      {...props}
    >
      {!isInView ? (
        // Placeholder while not in view
        <div className={cn(
          "flex items-center justify-center bg-neutral-100 dark:bg-neutral-800",
          fill ? "w-full h-full" : "w-full aspect-square"
        )}>
          <ImageIcon className="w-8 h-8 text-neutral-400" />
        </div>
      ) : hasError ? (
        // Error fallback
        fallback || (
          <div className={cn(
            "flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500",
            fill ? "w-full h-full" : "w-full aspect-square"
          )}>
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Error al cargar imagen</p>
            </div>
          </div>
        )
      ) : (
        <>
          {/* Loading overlay */}
          {isLoading && (
            <div className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800",
              "animate-pulse"
            )}>
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          )}

          {/* Optimized Next.js Image */}
          <Image
            src={src}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={defaultBlurDataURL}
            sizes={responsiveSizes}
            className={cn(
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              objectFit === "cover" && "object-cover",
              objectFit === "contain" && "object-contain",
              objectFit === "fill" && "object-fill",
              objectFit === "none" && "object-none",
              objectFit === "scale-down" && "object-scale-down"
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        </>
      )}
    </div>
  )
}

// Hook for generating WebP-compatible sources
export function useWebPSupport() {
  const [supportsWebP, setSupportsWebP] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, 1, 1)
        const dataURL = canvas.toDataURL('image/webp')
        setSupportsWebP(dataURL.startsWith('data:image/webp'))
      } else {
        setSupportsWebP(false)
      }
    }

    checkWebPSupport()
  }, [])

  return supportsWebP
}

// Utility function to convert image URLs to WebP when supported
export function getOptimizedImageUrl(
  originalUrl: string, 
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'auto'
  } = {}
): string {
  const { width, height, quality = 75, format = 'auto' } = options

  // If it's a Next.js optimized image URL, return as is
  if (originalUrl.includes('/_next/image')) {
    return originalUrl
  }

  // For external images, we can use Next.js image optimization
  const params = new URLSearchParams()
  params.set('url', originalUrl)
  params.set('q', quality.toString())
  
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  if (format !== 'auto') params.set('f', format)

  return `/_next/image?${params.toString()}`
}

// Component for responsive image with multiple sources
interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: {
    webp?: string
    avif?: string
    fallback: string
  }
}

export function ResponsiveImage({
  srcSet,
  src,
  ...props
}: ResponsiveImageProps) {
  const supportsWebP = useWebPSupport()

  // Determine the best source to use
  const optimizedSrc = React.useMemo(() => {
    if (!srcSet) return src

    if (supportsWebP && srcSet.webp) return srcSet.webp
    if (srcSet.avif) return srcSet.avif
    return srcSet.fallback || src
  }, [srcSet, src, supportsWebP])

  return <OptimizedImage src={optimizedSrc} {...props} />
}