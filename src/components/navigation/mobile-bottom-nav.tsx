'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home,
  Sparkles,
  Calendar,
  Users,
  Settings,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TouchFeedback from '@/components/mobile/touch-feedback'
import { useSwipeGestures } from '@/hooks/use-swipe-gestures'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  isAction?: boolean
}

const mobileNavItems: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'content',
    label: 'Generate',
    icon: Sparkles,
    href: '/dashboard/content/generate',
    badge: 'AI'
  },
  {
    id: 'create',
    label: 'Create',
    icon: Plus,
    href: '/dashboard/content/create',
    isAction: true
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    href: '/dashboard/campaigns/calendar'
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    href: '/dashboard/clients'
  }
]

interface MobileBottomNavProps {
  className?: string
}

export default function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // Swipe gestures for navigation
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: () => {
      // Navigate to next tab
      const currentIndex = mobileNavItems.findIndex(item => isActive(item.href))
      const nextIndex = (currentIndex + 1) % mobileNavItems.length
      handleNavigation(mobileNavItems[nextIndex].href)
    },
    onSwipeRight: () => {
      // Navigate to previous tab
      const currentIndex = mobileNavItems.findIndex(item => isActive(item.href))
      const prevIndex = currentIndex === 0 ? mobileNavItems.length - 1 : currentIndex - 1
      handleNavigation(mobileNavItems[prevIndex].href)
    },
    threshold: 50
  })

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-lg border-t border-border",
        "safe-area-pb", // For devices with home indicator
        className
      )}
    >
      <div 
        className="flex items-center justify-around px-2 py-2"
        {...swipeGestures}
      >
        {mobileNavItems.map((item) => {
          const active = isActive(item.href)
          
          return (
            <TouchFeedback
              key={item.id}
              onTap={() => handleNavigation(item.href)}
              hapticFeedback={true}
              rippleEffect={true}
              scaleEffect={true}
              className="rounded-xl"
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center",
                  "h-14 w-14 p-1 rounded-xl",
                  "transition-all duration-200",
                  "min-h-[56px] min-w-[56px]", // Ensure minimum touch target
                  "relative",
                  active && "bg-primary/10 text-primary",
                  item.isAction && "bg-primary text-primary-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "h-5 w-5 mb-1",
                    item.isAction && "h-6 w-6"
                  )} />
                  
                  {item.badge && !item.isAction && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-medium leading-none",
                  "max-w-full truncate",
                  item.isAction && "text-primary-foreground"
                )}>
                  {item.label}
                </span>
                
                {active && !item.isAction && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30 
                    }}
                  />
                )}
              </div>
            </TouchFeedback>
          )
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom" />
    </motion.div>
  )
}