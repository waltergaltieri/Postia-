'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Palette, Users, Building2, Sparkles } from 'lucide-react'
import ClientBrandSwitcher from '@/components/client/client-brand-switcher'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BrandColors {
  primary: string
  secondary: string
  accent: string
  text: string
  background: string
}

interface Client {
  id: string
  brandName: string
  brandColors: BrandColors
  logoUrl?: string
  industry: string
  lastActive: Date
  isActive?: boolean
  totalProjects?: number
  activeProjects?: number
}

const mockClients: Client[] = [
  {
    id: '1',
    brandName: 'TechFlow Solutions',
    brandColors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#06b6d4',
      text: '#1f2937',
      background: '#f8fafc'
    },
    logoUrl: '/api/placeholder/32/32',
    industry: 'Technology',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isActive: true,
    totalProjects: 12,
    activeProjects: 3
  },
  {
    id: '2',
    brandName: 'Green Earth Co.',
    brandColors: {
      primary: '#10b981',
      secondary: '#047857',
      accent: '#34d399',
      text: '#064e3b',
      background: '#f0fdf4'
    },
    industry: 'Sustainability',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    totalProjects: 8,
    activeProjects: 2
  },
  {
    id: '3',
    brandName: 'Luxury Lifestyle',
    brandColors: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#a855f7',
      text: '#3c1361',
      background: '#faf5ff'
    },
    industry: 'Fashion & Luxury',
    lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    totalProjects: 15,
    activeProjects: 5
  },
  {
    id: '4',
    brandName: 'HealthFirst Medical',
    brandColors: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f87171',
      text: '#7f1d1d',
      background: '#fef2f2'
    },
    industry: 'Healthcare',
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    totalProjects: 6,
    activeProjects: 1
  }
]

export default function ClientBrandDemo() {
  const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0])

  const handleClientChange = (client: Client) => {
    setSelectedClient(client)
  }

  const handleManageClients = () => {
    console.log('Navigate to client management')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Client Brand Switcher Demo</h1>
              <p className="text-muted-foreground mt-1">
                Interactive client selection with brand preview capabilities
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Premium UI</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Switcher Column */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Full Client Switcher</h2>
              </div>
              
              <ClientBrandSwitcher
                currentClient={selectedClient}
                clients={mockClients}
                onClientChange={handleClientChange}
                onManageClients={handleManageClients}
              />
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Compact Version</h2>
              </div>
              
              <ClientBrandSwitcher
                currentClient={selectedClient}
                clients={mockClients}
                onClientChange={handleClientChange}
                onManageClients={handleManageClients}
                compact
              />
            </Card>
          </div>

          {/* Brand Preview Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Active Brand Preview</h2>
              </div>

              {selectedClient && (
                <motion.div
                  key={selectedClient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Brand Header */}
                  <div 
                    className="p-6 rounded-xl text-white relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedClient.brandColors.primary} 0%, ${selectedClient.brandColors.secondary} 100%)` 
                    }}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-4">
                        {selectedClient.logoUrl ? (
                          <img 
                            src={selectedClient.logoUrl} 
                            alt={`${selectedClient.brandName} logo`}
                            className="w-16 h-16 rounded-xl bg-white/20 p-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {selectedClient.brandName.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold">{selectedClient.brandName}</h3>
                          <p className="text-white/80">{selectedClient.industry}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {selectedClient.totalProjects} Total Projects
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {selectedClient.activeProjects} Active
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
                      style={{ backgroundColor: selectedClient.brandColors.accent }}
                    />
                    <div 
                      className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
                      style={{ backgroundColor: selectedClient.brandColors.accent }}
                    />
                  </div>

                  {/* Color Palette */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Brand Colors</h4>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(selectedClient.brandColors).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div 
                            className="w-full h-16 rounded-lg border border-border mb-2"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs font-medium capitalize">{name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{color}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sample UI Elements */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">UI Elements Preview</h4>
                    <div className="space-y-4">
                      {/* Buttons */}
                      <div className="flex space-x-3">
                        <Button 
                          style={{ 
                            backgroundColor: selectedClient.brandColors.primary,
                            borderColor: selectedClient.brandColors.primary 
                          }}
                          className="text-white hover:opacity-90"
                        > <span>Primary Button</span></Button>
                        <Button 
                          variant="outline"
                          style={{ 
                            borderColor: selectedClient.brandColors.primary,
                            color: selectedClient.brandColors.primary 
                          }}
                          className="hover:bg-opacity-10"
                        > <span>Secondary Button</span></Button>
                      </div>

                      {/* Sample Card */}
                      <Card 
                        className="p-4"
                        style={{ borderColor: selectedClient.brandColors.primary + '20' }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedClient.brandColors.accent }}
                          />
                          <div>
                            <p className="font-medium" style={{ color: selectedClient.brandColors.text }}>
                              Sample Content Card
                            </p>
                            <p className="text-sm text-muted-foreground">
                              This shows how content would look with the selected brand colors
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">ClientBrandSwitcher Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Visual Client Selection</h4>
              <p className="text-sm text-muted-foreground">Rich previews with logos and brand colors</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Palette className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Brand Color Preview</h4>
              <p className="text-sm text-muted-foreground">Live color palette visualization</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Recent Clients</h4>
              <p className="text-sm text-muted-foreground">Quick access to frequently used clients</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Search & Filter</h4>
              <p className="text-sm text-muted-foreground">Find clients by name or industry</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}