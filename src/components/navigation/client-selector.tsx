'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Users,
  Clock,
  Check,
  Search,
  Plus,
  Building2,
  Palette,
  Star,
  X,
  Settings,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useNavigation, useRecentClients } from './navigation-context'
import AdminDashboardToggle from './admin-dashboard-toggle'

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
  industry?: string
  isActive?: boolean
  totalProjects?: number
  activeProjects?: number
}

interface ClientSelectorProps {
  className?: string
  compact?: boolean
  showAdminToggle?: boolean
  onManageClients?: () => void
  onAddClient?: () => void
  onAdminDashboard?: () => void
}

export default function ClientSelector({
  className,
  compact = false,
  showAdminToggle = true,
  onManageClients,
  onAddClient,
  onAdminDashboard
}: ClientSelectorProps) {
  const {
    currentClient,
    clients,
    selectedClientId,
    clientWorkspaceMode,
    switchToClient,
    switchToAdminDashboard,
    loading
  } = useNavigation()

  const { recentClients } = useRecentClients()

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Transform clients data to match interface
  const transformedClients: Client[] = clients.map(client => ({
    id: client.id,
    brandName: client.brandName,
    brandColors: client.brandColors || ['#3b82f6'],
    logoUrl: client.logoUrl,
    industry: 'Marketing', // Default for now
    isActive: true,
    totalProjects: 0,
    activeProjects: 0
  }))

  // Filter clients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(transformedClients)
    } else {
      const filtered = transformedClients.filter(client =>
        client.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.industry && client.industry.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredClients(filtered)
    }
    setHighlightedIndex(-1)
  }, [searchQuery, clients])

  // Get recent clients with proper data structure
  const getRecentClients = (): Client[] => {
    if (recentClients.length > 0) {
      return recentClients
        .map(recent => transformedClients.find(client => client.id === recent.clientId))
        .filter((client): client is Client => client !== undefined)
        .slice(0, 5)
    }

    // Fallback to first few clients if no recent data
    return transformedClients
      .filter(client => client.id !== selectedClientId)
      .slice(0, 5)
  }

  // Handle client selection
  const handleClientSelect = async (client: Client) => {
    try {
      await switchToClient(client.id)
      setIsOpen(false)
      setSearchQuery('')
      setHighlightedIndex(-1)
    } catch (error) {
      console.error('Error switching to client:', error)
    }
  }

  // Handle admin dashboard toggle
  const handleAdminToggle = () => {
    switchToAdminDashboard()
    setIsOpen(false)
    setSearchQuery('')
    onAdminDashboard?.()
  }

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return

    const items = filteredClients
    const maxIndex = items.length - 1

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => prev < maxIndex ? prev + 1 : 0)
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : maxIndex)
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          handleClientSelect(items[highlightedIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
        break
    }
  }

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Admin Dashboard Preview Component
  const AdminDashboardPreview = ({
    isSelected = false,
    isHighlighted = false,
    compact = false
  }: {
    isSelected?: boolean
    isHighlighted?: boolean
    compact?: boolean
  }) => (
    <div className={cn(
      "flex items-center space-x-3 w-full transition-all duration-200",
      !compact && "p-3 rounded-lg",
      isHighlighted && "bg-accent/50",
      isSelected && "bg-primary/10 border border-primary/20"
    )}>
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background">
            <div className="w-full h-full bg-primary rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-foreground">
            Admin Dashboard
          </h3>
          {isSelected && (
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-muted-foreground">
            Manage all clients and settings
          </span>
        </div>

        {/* Admin Features Preview */}
        <div className="flex items-center space-x-1 mt-2">
          <div className="flex items-center space-x-1">
            <Settings className="w-3 h-3 text-muted-foreground" />
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <Shield className="w-3 h-3 text-muted-foreground" />
          </div>

          <Badge variant="secondary" className="ml-auto text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>
    </div>
  )

  const ClientPreview = ({
    client,
    isSelected = false,
    isHighlighted = false,
    showMetrics = false
  }: {
    client: Client
    isSelected?: boolean
    isHighlighted?: boolean
    showMetrics?: boolean
  }) => (
    <div className={cn(
      "flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200",
      isHighlighted && "bg-accent/50",
      isSelected && "bg-primary/10 border border-primary/20"
    )}>
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
            style={{ backgroundColor: client.brandColors[0] }}
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

        {client.industry && (
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {client.industry}
            </span>
          </div>
        )}

        {/* Brand Colors Preview */}
        <div className="flex items-center space-x-1 mt-2">
          {client.brandColors.slice(0, 3).map((color, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full border border-border"
              style={{ backgroundColor: color }}
            />
          ))}

          {showMetrics && client.activeProjects && client.activeProjects > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {client.activeProjects} active
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  if (compact) {
    return (
      <div className={cn("relative", className)} ref={dropdownRef}>
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-2 hover:bg-muted/50"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          {currentClient ? (
            <div className="flex items-center space-x-2 min-w-0">
              {currentClient.logoUrl ? (
                <img
                  src={currentClient.logoUrl}
                  alt={`${currentClient.brandName} logo`}
                  className="w-6 h-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: currentClient.brandColors[0] }}
                >
                  {currentClient.brandName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-sm truncate">{currentClient.brandName}</span>
              <div className="flex space-x-1 flex-shrink-0">
                {currentClient.brandColors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ) : clientWorkspaceMode === 'admin' ? (
            <AdminDashboardPreview isSelected compact />
          ) : (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Select Client</span>
            </div>
          )}
          <ChevronDown className={cn(
            "ml-auto h-4 w-4 transition-transform flex-shrink-0",
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
              <div className="p-2 space-y-1">
                {showAdminToggle && (
                  <>
                    <AdminDashboardToggle
                      variant="compact"
                      onToggle={() => {
                        setIsOpen(false)
                        setSearchQuery('')
                        onAdminDashboard?.()
                      }}
                    />
                    <Separator />
                  </>
                )}

                {getRecentClients().map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-1"
                    onClick={() => handleClientSelect(client)}
                  >
                    <ClientPreview
                      client={client}
                      isSelected={selectedClientId === client.id}
                    />
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
    <div className={cn("relative", className)} ref={dropdownRef} onKeyDown={handleKeyDown}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start h-auto p-4",
          "hover:bg-muted/50 transition-all duration-200",
          "border-2 hover:border-primary/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        {currentClient ? (
          <ClientPreview client={currentClient} isSelected />
        ) : clientWorkspaceMode === 'admin' ? (
          <AdminDashboardPreview isSelected />
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
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {/* Admin Dashboard Toggle */}
              {showAdminToggle && !searchQuery && (
                <div className="p-4 border-b border-border">
                  <AdminDashboardToggle
                    variant="full"
                    onToggle={() => {
                      setIsOpen(false)
                      setSearchQuery('')
                      onAdminDashboard?.()
                    }}
                  />
                </div>
              )}

              {/* Recent Clients */}
              {!searchQuery && getRecentClients().length > 0 && (
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Recent</span>
                  </div>
                  <div className="space-y-1">
                    {getRecentClients().map((client, index) => (
                      <Button
                        key={client.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-auto p-0 hover:bg-muted/50",
                          highlightedIndex === index && "bg-accent/50"
                        )}
                        onClick={() => handleClientSelect(client)}
                      >
                        <ClientPreview
                          client={client}
                          isSelected={selectedClientId === client.id}
                          isHighlighted={highlightedIndex === index}
                          showMetrics
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

                  <div className="space-y-1">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client, index) => (
                        <Button
                          key={client.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-auto p-0 hover:bg-muted/50",
                            highlightedIndex === index && "bg-accent/50"
                          )}
                          onClick={() => handleClientSelect(client)}
                        >
                          <ClientPreview
                            client={client}
                            isSelected={selectedClientId === client.id}
                            isHighlighted={highlightedIndex === index}
                            showMetrics
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
                  <span>Manage Clients</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onAddClient?.()
                    setIsOpen(false)
                    setSearchQuery('')
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Client</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}