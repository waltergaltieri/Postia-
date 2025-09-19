'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  Eye,
  Settings,
  Users,
  Plus
} from 'lucide-react'
import ClientSelector from './client-selector'
import AdminDashboardToggle from './admin-dashboard-toggle'

export default function ClientSelectorDemo() {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCompact, setShowCompact] = useState(false)

  const handleManageClients = () => {
    console.log('Navigate to client management')
  }

  const handleAddClient = () => {
    console.log('Open add client modal')
  }

  const handleAdminDashboard = () => {
    console.log('Navigate to admin dashboard')
  }

  const getContainerWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-sm'
      case 'tablet': return 'max-w-md'
      default: return 'max-w-lg'
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Client Selector</h1>
        <p className="text-muted-foreground">
          Advanced client selection with search, filtering, and admin dashboard toggle
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Demo Controls</h3>
            <Badge variant="secondary">Interactive Demo</Badge>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">View:</span>
              <div className="flex rounded-lg border border-border p-1">
                {[
                  { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
                  { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
                  { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' }
                ].map(({ mode, icon: Icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="h-8"
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Compact Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Mode:</span>
              <Button
                variant={showCompact ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCompact(!showCompact)}
              >
                {showCompact ? 'Compact' : 'Full'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Demo */}
      <div className="flex justify-center">
        <motion.div
          key={`${viewMode}-${showCompact}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "w-full transition-all duration-300",
            getContainerWidth()
          )}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Client Selector</h3>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground capitalize">
                    {viewMode} {showCompact ? '(Compact)' : '(Full)'}
                  </span>
                </div>
              </div>

              <ClientSelector
                compact={showCompact}
                showAdminToggle={true}
                onManageClients={handleManageClients}
                onAddClient={handleAddClient}
                onAdminDashboard={handleAdminDashboard}
                className="w-full"
              />

              <Separator />

              {/* Standalone Admin Toggle Variants */}
              <div className="space-y-4">
                <h4 className="font-medium">Admin Dashboard Toggle Variants</h4>
                
                <div className="grid gap-4">
                  {/* Full Variant */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Full Variant</span>
                    <AdminDashboardToggle 
                      variant="full"
                      onToggle={handleAdminDashboard}
                    />
                  </div>

                  {/* Compact Variant */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Compact Variant</span>
                    <AdminDashboardToggle 
                      variant="compact"
                      onToggle={handleAdminDashboard}
                    />
                  </div>

                  {/* Minimal Variant */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Minimal Variant</span>
                    <div className="flex space-x-2">
                      <AdminDashboardToggle 
                        variant="minimal"
                        onToggle={handleAdminDashboard}
                      />
                      <AdminDashboardToggle 
                        variant="minimal"
                        onToggle={handleAdminDashboard}
                      />
                      <AdminDashboardToggle 
                        variant="minimal"
                        onToggle={handleAdminDashboard}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Features List */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Features Implemented</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-primary">Client Selection Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Search and filter clients</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Recent clients quick access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Client branding display (colors, logos)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Keyboard navigation support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Responsive design (compact/full modes)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-primary">Admin Dashboard Toggle</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Visual mode indicators</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Smooth transitions and animations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Multiple display variants</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Active state management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Integrated with navigation context</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}