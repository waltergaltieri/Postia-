'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu,
  X,
  Building2,
  Search,
  Bell,
  User,
  ChevronDown,
  Settings,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import TourManagementHub from '@/components/onboarding/tour-management-hub'
import { FloatingTourProgress } from './tour-progress-indicator'
import { useTourNavigation } from '@/hooks/use-tour-navigation'

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
}

interface MobileHeaderProps {
  currentClient?: Client | null
  clients?: Client[]
  onClientChange?: (client: Client) => void
  className?: string
}

export default function MobileHeader({ 
  currentClient, 
  clients = [], 
  onClientChange,
  className 
}: MobileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showClientSwitcher, setShowClientSwitcher] = useState(false)
  const router = useRouter()
  
  // Tour navigation integration
  const { handleNavigationAttempt } = useTourNavigation({
    lockNavigationDuringTour: true
  })

  const ClientBrandIndicator = ({ client, compact = false }: { client: Client, compact?: boolean }) => (
    <div className="flex items-center space-x-2">
      {client.logoUrl ? (
        <img 
          src={client.logoUrl} 
          alt={client.brandName}
          className={cn(
            "rounded object-cover",
            compact ? "w-5 h-5" : "w-6 h-6"
          )}
        />
      ) : (
        <div 
          className={cn(
            "rounded flex items-center justify-center text-xs font-bold text-white",
            compact ? "w-5 h-5" : "w-6 h-6"
          )}
          style={{ backgroundColor: client.brandColors?.[0] || '#3b82f6' }}
        >
          {client.brandName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-foreground truncate",
          compact ? "text-xs" : "text-sm"
        )}>
          {client.brandName}
        </p>
        {!compact && (
          <div className="flex space-x-1 mt-0.5">
            {client.brandColors?.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={cn(
          "fixed top-0 left-0 right-0 z-40",
          "bg-background/95 backdrop-blur-lg border-b border-border",
          "safe-area-pt", // For devices with notch
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu + Brand */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setShowMenu(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Postia</h1>
              </div>
            </div>
          </div>

          {/* Center: Client Switcher (if available) */}
          {currentClient && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 max-w-[200px] mx-4 h-9 justify-start"
              onClick={() => setShowClientSwitcher(true)}
            >
              <ClientBrandIndicator client={currentClient} compact />
              <ChevronDown className="ml-auto h-3 w-3" />
            </Button>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-1">
            <TourManagementHub />
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
            </Button>
          </div>
        </div>
        
        {/* Safe area padding for devices with notch */}
        <div className="h-safe-area-inset-top" />
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] bg-background border-r border-border shadow-xl"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Postia</h2>
                    <p className="text-xs text-muted-foreground">Marketing Suite</p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                  {/* This would contain the full navigation items */}
                  {/* For now, showing key items */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      if (handleNavigationAttempt('/dashboard')) {
                        router.push('/dashboard')
                        setShowMenu(false)
                      }
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      if (handleNavigationAttempt('/dashboard/content')) {
                        router.push('/dashboard/content')
                        setShowMenu(false)
                      }
                    }}
                  >
                    Content Generation
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      if (handleNavigationAttempt('/dashboard/campaigns')) {
                        router.push('/dashboard/campaigns')
                        setShowMenu(false)
                      }
                    }}
                  >
                    Campaigns
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      if (handleNavigationAttempt('/dashboard/clients')) {
                        router.push('/dashboard/clients')
                        setShowMenu(false)
                      }
                    }}
                  >
                    Clients
                  </Button>
                </nav>
              </div>

              {/* Menu Footer */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Agency User
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Premium Plan
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Client Switcher Modal */}
      <AnimatePresence>
        {showClientSwitcher && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowClientSwitcher(false)}
            />
            
            {/* Client Switcher Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-80 max-w-[90vw] bg-background border border-border rounded-xl shadow-xl"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Switch Client
                </h3>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {clients.map((client) => (
                    <Button
                      key={client.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left"
                      onClick={() => {
                        onClientChange?.(client)
                        setShowClientSwitcher(false)
                      }}
                    >
                      <ClientBrandIndicator client={client} />
                    </Button>
                  ))}
                  
                  <Separator className="my-2" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      if (handleNavigationAttempt('/dashboard/clients')) {
                        router.push('/dashboard/clients')
                        setShowClientSwitcher(false)
                      }
                    }}
                  >
                    Manage Clients
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Tour Progress for Mobile */}
      <FloatingTourProgress />
    </>
  )
}