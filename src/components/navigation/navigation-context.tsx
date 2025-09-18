'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface Client {
  id: string
  brandName: string
  brandColors: string[]
  logoUrl?: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  isActive?: boolean
  metadata?: {
    clientName?: string
    campaignName?: string
    contentType?: string
    status?: string
  }
}

interface NavigationContextType {
  // Client Management
  currentClient: Client | null
  setCurrentClient: (client: Client | null) => void
  clients: Client[]
  setClients: (clients: Client[]) => void
  
  // Campaign Management
  currentCampaign: Campaign | null
  setCurrentCampaign: (campaign: Campaign | null) => void
  
  // Breadcrumb Management
  breadcrumbs: BreadcrumbItem[]
  setBreadcrumbs: (items: BreadcrumbItem[]) => void
  addBreadcrumb: (item: BreadcrumbItem) => void
  removeBreadcrumb: (href: string) => void
  
  // Workflow State
  workflowStep: number
  totalSteps: number
  setWorkflowProgress: (step: number, total: number) => void
  
  // Loading States
  loading: boolean
  setLoading: (loading: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { data: session } = useSession()
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [workflowStep, setWorkflowStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch clients on session load
  useEffect(() => {
    const fetchClients = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/clients')
        const result = await response.json()
        
        if (result.success && result.data.clients.length > 0) {
          const clientsData = result.data.clients.map((client: any) => ({
            id: client.id,
            brandName: client.brandName,
            brandColors: client.brandColors || ['#3b82f6'],
            logoUrl: client.logoUrl
          }))
          
          setClients(clientsData)
          
          // Set first client as default if none selected
          if (!currentClient && clientsData.length > 0) {
            setCurrentClient(clientsData[0])
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [session])

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      // Remove existing item with same href
      const filtered = prev.filter(b => b.href !== item.href)
      return [...filtered, item]
    })
  }

  const removeBreadcrumb = (href: string) => {
    setBreadcrumbs(prev => prev.filter(b => b.href !== href))
  }

  const setWorkflowProgress = (step: number, total: number) => {
    setWorkflowStep(step)
    setTotalSteps(total)
  }

  const value: NavigationContextType = {
    currentClient,
    setCurrentClient,
    clients,
    setClients,
    currentCampaign,
    setCurrentCampaign,
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    workflowStep,
    totalSteps,
    setWorkflowProgress,
    loading,
    setLoading
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

// Convenience hooks
export function useCurrentClient() {
  const { currentClient, setCurrentClient } = useNavigation()
  return { currentClient, setCurrentClient }
}

export function useClients() {
  const { clients, setClients } = useNavigation()
  return { clients, setClients }
}

export function useWorkflowProgress() {
  const { workflowStep, totalSteps, setWorkflowProgress } = useNavigation()
  return { workflowStep, totalSteps, setWorkflowProgress }
}