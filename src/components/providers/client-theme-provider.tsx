'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigation } from '@/components/navigation/navigation-context'

interface ClientTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  // Brand-specific colors
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  // Logo and assets
  logoUrl?: string
  faviconUrl?: string
  // Typography
  fontFamily?: string
  // Custom properties
  customProperties?: Record<string, string>
}

interface ClientThemeSettings {
  brandColors: string[]
  logoUrl?: string
  faviconUrl?: string
  fontFamily?: string
  themeMode?: 'light' | 'dark' | 'auto'
  customCss?: string
  accentColor?: string
  backgroundPattern?: string
}

interface ClientThemeContextType {
  currentTheme: ClientTheme | null
  themeSettings: ClientThemeSettings | null
  applyClientTheme: (settings: ClientThemeSettings) => void
  resetToDefaultTheme: () => void
  generateThemeFromBrandColors: (colors: string[]) => ClientTheme
  isClientThemeActive: boolean
}

const ClientThemeContext = createContext<ClientThemeContextType | undefined>(undefined)

// Default theme values
const defaultTheme: ClientTheme = {
  primary: 'hsl(222.2 84% 4.9%)',
  secondary: 'hsl(210 40% 96%)',
  accent: 'hsl(210 40% 96%)',
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(222.2 84% 4.9%)',
  muted: 'hsl(210 40% 96%)',
  mutedForeground: 'hsl(215.4 16.3% 46.9%)',
  border: 'hsl(214.3 31.8% 91.4%)',
  input: 'hsl(214.3 31.8% 91.4%)',
  ring: 'hsl(222.2 84% 4.9%)',
  brandPrimary: 'hsl(222.2 84% 4.9%)',
  brandSecondary: 'hsl(210 40% 96%)',
  brandAccent: 'hsl(210 40% 96%)'
}

interface ClientThemeProviderProps {
  children: ReactNode
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  const { currentClient, selectedClientId, clientWorkspaceMode } = useNavigation()
  const [currentTheme, setCurrentTheme] = useState<ClientTheme | null>(null)
  const [themeSettings, setThemeSettings] = useState<ClientThemeSettings | null>(null)
  const [isClientThemeActive, setIsClientThemeActive] = useState(false)

  // Convert hex color to HSL
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
  }

  // Generate theme variations from a base color
  const generateColorVariations = (baseColor: string) => {
    const hsl = hexToHsl(baseColor)
    const [h, s, l] = hsl.match(/\d+/g)?.map(Number) || [0, 0, 0]
    
    return {
      primary: `hsl(${h} ${s}% ${Math.max(l - 20, 10)}%)`,
      secondary: `hsl(${h} ${Math.max(s - 30, 10)}% ${Math.min(l + 40, 95)}%)`,
      accent: `hsl(${h} ${Math.max(s - 20, 15)}% ${Math.min(l + 30, 90)}%)`,
      muted: `hsl(${h} ${Math.max(s - 40, 5)}% ${Math.min(l + 45, 96)}%)`,
      mutedForeground: `hsl(${h} ${Math.max(s - 30, 10)}% ${Math.max(l - 30, 20)}%)`,
      border: `hsl(${h} ${Math.max(s - 35, 10)}% ${Math.min(l + 35, 91)}%)`,
      ring: `hsl(${h} ${s}% ${Math.max(l - 15, 15)}%)`
    }
  }

  // Generate complete theme from brand colors
  const generateThemeFromBrandColors = (colors: string[]): ClientTheme => {
    if (!colors || colors.length === 0) {
      return defaultTheme
    }

    const primaryColor = colors[0]
    const variations = generateColorVariations(primaryColor)
    
    return {
      ...defaultTheme,
      ...variations,
      brandPrimary: hexToHsl(colors[0]),
      brandSecondary: colors[1] ? hexToHsl(colors[1]) : variations.secondary,
      brandAccent: colors[2] ? hexToHsl(colors[2]) : variations.accent
    }
  }

  // Apply theme to CSS custom properties
  const applyThemeToDOM = (theme: ClientTheme) => {
    const root = document.documentElement
    
    // Apply theme colors
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--client-${key}`, value)
      }
    })

    // Apply custom properties if any
    if (theme.customProperties) {
      Object.entries(theme.customProperties).forEach(([key, value]) => {
        root.style.setProperty(`--client-${key}`, value)
      })
    }

    // Set client theme active flag
    root.style.setProperty('--client-theme-active', '1')
  }

  // Remove client theme from DOM
  const removeThemeFromDOM = () => {
    const root = document.documentElement
    const styles = root.style
    
    // Remove all client theme properties
    for (let i = styles.length - 1; i >= 0; i--) {
      const property = styles[i]
      if (property.startsWith('--client-')) {
        root.style.removeProperty(property)
      }
    }
  }

  // Apply client theme
  const applyClientTheme = (settings: ClientThemeSettings) => {
    const theme = generateThemeFromBrandColors(settings.brandColors)
    
    // Add additional settings to theme
    if (settings.logoUrl) theme.logoUrl = settings.logoUrl
    if (settings.faviconUrl) theme.faviconUrl = settings.faviconUrl
    if (settings.fontFamily) theme.fontFamily = settings.fontFamily
    
    // Apply custom CSS if provided
    if (settings.customCss) {
      theme.customProperties = {
        ...theme.customProperties,
        'custom-css': settings.customCss
      }
    }

    setCurrentTheme(theme)
    setThemeSettings(settings)
    setIsClientThemeActive(true)
    applyThemeToDOM(theme)

    // Update favicon if provided
    if (settings.faviconUrl) {
      updateFavicon(settings.faviconUrl)
    }
  }

  // Reset to default theme
  const resetToDefaultTheme = () => {
    setCurrentTheme(null)
    setThemeSettings(null)
    setIsClientThemeActive(false)
    removeThemeFromDOM()
    
    // Reset favicon to default
    updateFavicon('/favicon.ico')
  }

  // Update favicon
  const updateFavicon = (url: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = url
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  // Apply client theme when client changes
  useEffect(() => {
    if (clientWorkspaceMode === 'client' && currentClient && selectedClientId) {
      // Check if client has custom theme settings
      const clientThemeSettings: ClientThemeSettings = {
        brandColors: currentClient.brandColors || ['#3b82f6'],
        logoUrl: currentClient.logoUrl,
        // Add more theme settings from client data if available
      }
      
      applyClientTheme(clientThemeSettings)
    } else {
      // Reset to default theme when not in client workspace
      resetToDefaultTheme()
    }
  }, [currentClient, selectedClientId, clientWorkspaceMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeThemeFromDOM()
    }
  }, [])

  const value: ClientThemeContextType = {
    currentTheme,
    themeSettings,
    applyClientTheme,
    resetToDefaultTheme,
    generateThemeFromBrandColors,
    isClientThemeActive
  }

  return (
    <ClientThemeContext.Provider value={value}>
      {children}
    </ClientThemeContext.Provider>
  )
}

export function useClientTheme() {
  const context = useContext(ClientThemeContext)
  if (context === undefined) {
    throw new Error('useClientTheme must be used within a ClientThemeProvider')
  }
  return context
}

// Hook for getting current client brand colors
export function useClientBrandColors() {
  const { currentClient } = useNavigation()
  const { currentTheme, isClientThemeActive } = useClientTheme()
  
  return {
    brandColors: currentClient?.brandColors || [],
    primaryColor: currentTheme?.brandPrimary || defaultTheme.brandPrimary,
    secondaryColor: currentTheme?.brandSecondary || defaultTheme.brandSecondary,
    accentColor: currentTheme?.brandAccent || defaultTheme.brandAccent,
    isClientThemeActive
  }
}

// Hook for applying theme-aware styles
export function useClientThemedStyles() {
  const { isClientThemeActive } = useClientTheme()
  
  const getThemedClassName = (baseClass: string, clientClass?: string) => {
    if (isClientThemeActive && clientClass) {
      return `${baseClass} ${clientClass}`
    }
    return baseClass
  }
  
  const getThemedStyle = (baseStyle: React.CSSProperties, clientStyle?: React.CSSProperties) => {
    if (isClientThemeActive && clientStyle) {
      return { ...baseStyle, ...clientStyle }
    }
    return baseStyle
  }
  
  return {
    getThemedClassName,
    getThemedStyle,
    isClientThemeActive
  }
}