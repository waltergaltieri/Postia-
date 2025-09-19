'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  BarChart3,
  Settings,
  Building2,
  Shield,
  CreditCard,
  Bell,
  FileText,
  Zap,
  ChevronDown,
  User,
  ArrowLeft
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNavigation } from './navigation-context'

interface AdminNavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  children?: AdminNavigationItem[]
}

const adminNavigationItems: AdminNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard/admin'
  },
  {
    id: 'clients',
    label: 'Client Management',
    icon: Users,
    href: '/dashboard/admin/clients',
    children: [
      {
        id: 'clients-list',
        label: 'All Clients',
        icon: Users,
        href: '/dashboard/admin/clients'
      },
      {
        id: 'clients-new',
        label: 'Add Client',
        icon: Users,
        href: '/dashboard/admin/clients/new'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    href: '/dashboard/admin/analytics',
    children: [
      {
        id: 'analytics-overview',
        label: 'Overview',
        icon: BarChart3,
        href: '/dashboard/admin/analytics'
      },
      {
        id: 'analytics-performance',
        label: 'Performance',
        icon: Zap,
        href: '/dashboard/admin/analytics/performance'
      },
      {
        id: 'analytics-reports',
        label: 'Reports',
        icon: FileText,
        href: '/dashboard/admin/analytics/reports'
      }
    ]
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Shield,
    href: '/dashboard/admin/users'
  },
  {
    id: 'billing',
    label: 'Billing & Plans',
    icon: CreditCard,
    href: '/dashboard/admin/billing'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '/dashboard/admin/notifications',
    badge: 3
  },
  {
    id: 'settings',
    label: 'Agency Settings',
    icon: Settings,
    href: '/dashboard/admin/settings'
  }
]

interface AdminSidebarProps {
  className?: string
}

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['clients', 'analytics'])
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { switchToAdminDashboard } = useNavigation()

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-expand parent items based on current path
  useEffect(() => {
    adminNavigationItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => pathname.startsWith(child.href))
        if (hasActiveChild && !expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id])
        }
      }
    })
  }, [pathname])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === '/dashboard/admin'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleBackToClientMode = () => {
    router.push('/dashboard')
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full w-64 bg-card border-r border-border transition-all duration-300",
        isCollapsed && !isMobile && "w-16",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Agency Management</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-muted"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Back to Client Mode */}
        {!isCollapsed && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleBackToClientMode}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Client Mode
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {adminNavigationItems.map((item) => (
            <div key={item.id}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive(item.href) && "bg-secondary text-secondary-foreground"
                )}
                onClick={() => {
                  if (item.children) {
                    toggleExpanded(item.id)
                  } else {
                    handleNavigation(item.href)
                  }
                }}
              >
                <item.icon className="h-4 w-4" />
                
                {!isCollapsed && (
                  <>
                    <span className="ml-2 flex-1 text-left">{item.label}</span>
                    
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                    
                    {item.children && (
                      <ChevronDown className={cn(
                        "h-4 w-4 ml-2 transition-transform",
                        expandedItems.includes(item.id) && "rotate-180"
                      )} />
                    )}
                  </>
                )}
              </Button>

              {/* Submenu */}
              <AnimatePresence>
                {item.children && expandedItems.includes(item.id) && !isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-2 space-y-1"
                  >
                    {item.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={isActive(child.href) ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start",
                          isActive(child.href) && "bg-secondary text-secondary-foreground"
                        )}
                        onClick={() => handleNavigation(child.href)}
                      >
                        <child.icon className="h-3 w-3" />
                        <span className="ml-2">{child.label}</span>
                        {child.badge && (
                          <Badge variant="outline" className="ml-auto">
                            {child.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground">Agency Owner</p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full">
            <User className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}