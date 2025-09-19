'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle,
  Settings,
  RotateCcw,
  BookOpen,
  X,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import TourLibrary from './tour-library'
import TourSettings from './tour-settings'
import TourReplayManager from './tour-replay-manager'

interface TourManagementHubProps {
  className?: string
  defaultView?: 'library' | 'settings' | 'replay'
}

type ViewType = 'library' | 'settings' | 'replay' | null

const views = [
  {
    id: 'library' as const,
    name: 'Tour Library',
    description: 'Browse and start available tours',
    icon: BookOpen,
    color: 'bg-info-500'
  },
  {
    id: 'settings' as const,
    name: 'Settings',
    description: 'Customize your tour experience',
    icon: Settings,
    color: 'bg-success-500'
  },
  {
    id: 'replay' as const,
    name: 'Replay Tours',
    description: 'Replay completed tours',
    icon: RotateCcw,
    color: 'bg-purple-500'
  }
]

export default function TourManagementHub({ 
  className, 
  defaultView = null 
}: TourManagementHubProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>(defaultView)

  const openView = (view: ViewType) => {
    setCurrentView(view)
    setIsOpen(true)
  }

  const closeHub = () => {
    setIsOpen(false)
    setCurrentView(null)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'library':
        return <TourLibrary onClose={closeHub} />
      case 'settings':
        return <TourSettings onClose={closeHub} />
      case 'replay':
        return <TourReplayManager onClose={closeHub} />
      default:
        return null
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-9 w-9 p-0 hover:bg-muted/50 transition-colors",
          className
        )}
        aria-label="Open tour management hub"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* Management Hub Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closeHub}
            />
            
            {/* Main Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-6xl h-[90vh] bg-background border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {currentView ? (
                // Specific View Content
                <div className="h-full flex flex-col">
                  {/* View Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentView(null)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          {views.find(v => v.id === currentView)?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {views.find(v => v.id === currentView)?.description}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeHub}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* View Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {renderCurrentView()}
                  </div>
                </div>
              ) : (
                // Hub Overview
                <div className="h-full flex flex-col">
                  {/* Hub Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Tour Management Hub
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage your tour experience and preferences
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeHub}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Hub Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                      {views.map((view) => (
                        <Card 
                          key={view.id} 
                          className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                          onClick={() => openView(view.id)}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                              view.color
                            )}>
                              <view.icon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {view.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {view.description}
                              </p>
                              
                              <div className="flex items-center text-sm text-primary group-hover:translate-x-1 transition-transform">
                                <span>Open</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Separator className="my-8" />

                    {/* Quick Actions */}
                    <div className="max-w-4xl mx-auto">
                      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Start Welcome Tour</h4>
                              <p className="text-sm text-muted-foreground">
                                Perfect for new users
                              </p>
                            </div>
                            <Button size="sm" onClick={() => openView('library')}>
                              Start
                            </Button>
                          </div>
                        </Card>

                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Accessibility Settings</h4>
                              <p className="text-sm text-muted-foreground">
                                Customize for your needs
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openView('settings')}>
                              Configure
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="max-w-4xl mx-auto mt-8">
                      <Card className="p-6 bg-muted/20">
                        <div className="flex items-start space-x-3">
                          <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium mb-2">Need Help?</h4>
                            <p className="text-sm text-muted-foreground">
                              Tours are interactive guides that help you learn how to use Postia effectively. 
                              You can browse available tours, customize your experience, and replay tours 
                              you've already completed to refresh your knowledge.
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}