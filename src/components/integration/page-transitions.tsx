'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigation } from '@/components/navigation/navigation-context'

interface TransitionConfig {
  duration: number
  ease: number[]
  stagger: number
}

interface PageTransition {
  from: string
  to: string
  type: 'slide' | 'fade' | 'scale' | 'flip'
  direction?: 'left' | 'right' | 'up' | 'down'
  config?: Partial<TransitionConfig>
}

// Define transition rules based on navigation patterns
const TRANSITION_RULES: PageTransition[] = [
  // Dashboard to specific sections
  {
    from: '/dashboard',
    to: '/dashboard/content',
    type: 'slide',
    direction: 'right'
  },
  {
    from: '/dashboard',
    to: '/dashboard/campaigns',
    type: 'slide',
    direction: 'right'
  },
  {
    from: '/dashboard',
    to: '/dashboard/clients',
    type: 'slide',
    direction: 'right'
  },
  
  // Content workflow transitions
  {
    from: '/dashboard/content',
    to: '/dashboard/content/generate',
    type: 'slide',
    direction: 'right'
  },
  {
    from: '/dashboard/content/generate',
    to: '/dashboard/content/library',
    type: 'slide',
    direction: 'right'
  },
  
  // Campaign workflow transitions
  {
    from: '/dashboard/campaigns',
    to: '/dashboard/campaigns/calendar',
    type: 'slide',
    direction: 'right'
  },
  
  // Back navigation
  {
    from: '/dashboard/content/generate',
    to: '/dashboard/content',
    type: 'slide',
    direction: 'left'
  },
  {
    from: '/dashboard/content',
    to: '/dashboard',
    type: 'slide',
    direction: 'left'
  },
  
  // Modal-like transitions for detailed views
  {
    from: '/dashboard/content/library',
    to: '/dashboard/content/library/[id]',
    type: 'scale'
  },
  
  // Client switching transitions
  {
    from: '/dashboard/clients/[id]',
    to: '/dashboard/clients/[id2]',
    type: 'fade'
  }
]

const DEFAULT_CONFIG: TransitionConfig = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
  stagger: 0.1
}

interface PageTransitionsProps {
  children: React.ReactNode
  className?: string
}

export default function PageTransitions({ children, className = "" }: PageTransitionsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentClient, currentCampaign } = useNavigation()
  
  const [previousPath, setPreviousPath] = useState<string>('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionKey, setTransitionKey] = useState(0)

  // Update transition key when path changes
  useEffect(() => {
    if (pathname !== previousPath) {
      setIsTransitioning(true)
      setTransitionKey(prev => prev + 1)
      
      // Reset transition state after animation
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setPreviousPath(pathname)
      }, 400)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, previousPath])

  // Find matching transition rule
  const getTransitionConfig = (from: string, to: string): PageTransition => {
    // Normalize paths for pattern matching
    const normalizePath = (path: string) => {
      return path.replace(/\/[^\/]+$/, '/[id]') // Replace IDs with [id]
    }
    
    const normalizedFrom = normalizePath(from)
    const normalizedTo = normalizePath(to)
    
    // Find exact match first
    let rule = TRANSITION_RULES.find(r => r.from === from && r.to === to)
    
    // Then try normalized paths
    if (!rule) {
      rule = TRANSITION_RULES.find(r => r.from === normalizedFrom && r.to === normalizedTo)
    }
    
    // Try partial matches
    if (!rule) {
      rule = TRANSITION_RULES.find(r => 
        to.startsWith(r.to.replace('/[id]', '')) && from.startsWith(r.from.replace('/[id]', ''))
      )
    }
    
    // Default transition
    return rule || {
      from,
      to,
      type: 'fade',
      config: DEFAULT_CONFIG
    }
  }

  const transition = getTransitionConfig(previousPath, pathname)
  const config = { ...DEFAULT_CONFIG, ...transition.config }

  // Animation variants based on transition type
  const getAnimationVariants = () => {
    switch (transition.type) {
      case 'slide':
        const slideDistance = 50
        const direction = transition.direction || 'right'
        
        return {
          initial: {
            opacity: 0,
            x: direction === 'right' ? slideDistance : direction === 'left' ? -slideDistance : 0,
            y: direction === 'down' ? slideDistance : direction === 'up' ? -slideDistance : 0
          },
          animate: {
            opacity: 1,
            x: 0,
            y: 0
          },
          exit: {
            opacity: 0,
            x: direction === 'right' ? -slideDistance : direction === 'left' ? slideDistance : 0,
            y: direction === 'down' ? -slideDistance : direction === 'up' ? slideDistance : 0
          }
        }
      
      case 'scale':
        return {
          initial: {
            opacity: 0,
            scale: 0.95
          },
          animate: {
            opacity: 1,
            scale: 1
          },
          exit: {
            opacity: 0,
            scale: 1.05
          }
        }
      
      case 'flip':
        return {
          initial: {
            opacity: 0,
            rotateY: -90
          },
          animate: {
            opacity: 1,
            rotateY: 0
          },
          exit: {
            opacity: 0,
            rotateY: 90
          }
        }
      
      default: // fade
        return {
          initial: {
            opacity: 0
          },
          animate: {
            opacity: 1
          },
          exit: {
            opacity: 0
          }
        }
    }
  }

  const variants = getAnimationVariants()

  // Context-aware transitions (different animations based on client/campaign changes)
  const getContextTransition = () => {
    // If client changed, use a special transition
    if (previousPath.includes('/clients/') && pathname.includes('/clients/')) {
      return {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.02 }
      }
    }
    
    return variants
  }

  const contextVariants = getContextTransition()

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${transitionKey}-${currentClient?.id}-${currentCampaign?.id}`}
          initial={contextVariants.initial}
          animate={contextVariants.animate}
          exit={contextVariants.exit}
          transition={{
            duration: config.duration,
            ease: config.ease
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      
      {/* Loading overlay during transitions */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-50 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Staggered children animation component
interface StaggeredChildrenProps {
  children: React.ReactNode
  stagger?: number
  className?: string
}

export function StaggeredChildren({ children, stagger = 0.1, className = "" }: StaggeredChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Individual staggered item component
interface StaggeredItemProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function StaggeredItem({ children, className = "", delay = 0 }: StaggeredItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { delay }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Route transition hook
export function useRouteTransition() {
  const pathname = usePathname()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  
  const navigateWithTransition = (href: string, options?: { replace?: boolean }) => {
    setIsNavigating(true)
    
    // Add a small delay to show loading state
    setTimeout(() => {
      if (options?.replace) {
        router.replace(href)
      } else {
        router.push(href)
      }
      setIsNavigating(false)
    }, 100)
  }
  
  return {
    pathname,
    isNavigating,
    navigateWithTransition
  }
}

// Context-aware page wrapper
interface ContextAwarePageProps {
  children: React.ReactNode
  requiresClient?: boolean
  requiresCampaign?: boolean
  fallbackHref?: string
  className?: string
}

export function ContextAwarePage({ 
  children, 
  requiresClient = false, 
  requiresCampaign = false,
  fallbackHref = '/dashboard/clients',
  className = ""
}: ContextAwarePageProps) {
  const { currentClient, currentCampaign, loading } = useNavigation()
  const router = useRouter()
  
  useEffect(() => {
    if (loading) return
    
    if (requiresClient && !currentClient) {
      router.push(fallbackHref)
      return
    }
    
    if (requiresCampaign && !currentCampaign) {
      router.push('/dashboard/campaigns')
      return
    }
  }, [currentClient, currentCampaign, loading, requiresClient, requiresCampaign, router, fallbackHref])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }
  
  if (requiresClient && !currentClient) {
    return null // Will redirect
  }
  
  if (requiresCampaign && !currentCampaign) {
    return null // Will redirect
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}