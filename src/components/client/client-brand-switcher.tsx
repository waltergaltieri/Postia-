'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  Users, 
  Palette, 
  Image, 
  Clock,
  Check,
  Search,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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

interface ClientBrandSwitcherProps {
  currentClient?: Client
  clients?: Client[]
  recentClients?: Client[]
  onClientChange?: (client: Client) => void
  onManageClients?: () => void
  className?: string
  compact?: boolean
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
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
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
    lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
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
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    totalProjects: 6,
    activeProjects: 1
  }
]

export default function ClientBrandSwitcher({
  currentClient,
  clients = mockClients,
  recentClients,
  onClientChange,
  onManageClients,
  className,
  compact = false
}: ClientBrandSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState(clients)

  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client =>
        client.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [searchQuery, clients])

  // Get recent clients (last 5 active)
  const getRecentClients = () => {
    if (recentClients) return recentClients
    return clients
      .filter(client => client.id !== currentClient?.id)
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
      .slice(0, 5)
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Active now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  const ClientPreview = ({ client, isSelected = false }: { client: Client; isSelected?: boolean }) => (
    <div className="flex items-center space-x-3 w-full">
      {/* Logo or Brand Initial */}
      <div className="relative flex-shrink-0">
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`${client.brandName} logo`}
            className="w-10 h-10 rounded-lg object-cover border-2 border-border"
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm border-2 border-border"
            style={{ backgroundColor: client.brandColors.primary }}
          >
            {client.brandName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        {client.isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Client Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-foreground truncate">
            {client.brandName}
          </h3>
          {isSelected && (
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {client.industry}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatLastActive(client.lastActive)}
          </span>
        </div>

        {/* Brand Colors Preview */}
        <div className="flex items-center space-x-1 mt-2">
          <div 
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: client.brandColors.primary }}
          />
          <div 
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: client.brandColors.secondary }}
          />
          <div 
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: client.brandColors.accent }}
          />
          
          {client.activeProjects && client.activeProjects > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {client.activeProjects} active
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  const CompactClientPreview = ({ client }: { client: Client }) => (
    <div className="flex items-center space-x-2">
      {client.logoUrl ? (
        <img 
          src={client.logoUrl} 
          alt={`${client.brandName} logo`}
          className="w-6 h-6 rounded object-cover"
        />
      ) : (
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: client.brandColors.primary }}
        >
          {client.brandName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="font-medium text-sm truncate">{client.brandName}</span>
      <div className="flex space-x-1">
        {[client.brandColors.primary, client.brandColors.secondary, client.brandColors.accent]
          .slice(0, 3).map((color, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-3 hover:bg-muted/50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentClient ? (
            <CompactClientPreview client={currentClient} />
          ) : (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Select Client</span>
            </div>
          )}
          <ChevronDown className={cn(
            "ml-auto h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-hidden"
            >
              <div className="p-3 space-y-2">
                {getRecentClients().map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2"
                    onClick={() => {
                      onClientChange?.(client)
                      setIsOpen(false)
                    }}
                  >
                    <CompactClientPreview client={client} />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start h-auto p-4",
          "hover:bg-muted/50 transition-all duration-200",
          "border-2 hover:border-primary/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentClient ? (
          <ClientPreview client={currentClient} isSelected />
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Select Client</p>
              <p className="text-sm text-muted-foreground">Choose a client to work with</p>
            </div>
          </div>
        )}
        
        <ChevronDown className={cn(
          "ml-auto h-5 w-5 transition-transform text-muted-foreground",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {/* Recent Clients */}
              {!searchQuery && getRecentClients().length > 0 && (
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Recent</span>
                  </div>
                  <div className="space-y-2">
                    {getRecentClients().map((client) => (
                      <Button
                        key={client.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 hover:bg-muted/50"
                        onClick={() => {
                          onClientChange?.(client)
                          setIsOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <ClientPreview 
                          client={client} 
                          isSelected={currentClient?.id === client.id}
                        />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Clients */}
              {(searchQuery || getRecentClients().length === 0) && (
                <div className="p-4">
                  {searchQuery && (
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <Button
                          key={client.id}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 hover:bg-muted/50"
                          onClick={() => {
                            onClientChange?.(client)
                            setIsOpen(false)
                            setSearchQuery('')
                          }}
                        >
                          <ClientPreview 
                            client={client} 
                            isSelected={currentClient?.id === client.id}
                          />
                        </Button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No clients found</p>
                        <p className="text-xs">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onManageClients?.()
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Clients
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // Handle add new client
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}