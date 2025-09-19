'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { Badge, BadgeProps } from '@/components/ui/badge'
import { useClientTheme, useClientBrandColors, useClientThemedStyles } from '@/components/providers/client-theme-provider'
import { useNavigation } from '@/components/navigation/navigation-context'

// Client-themed Button component
interface ClientButtonProps extends ButtonProps {
  enableClientTheme?: boolean
  clientVariant?: 'primary' | 'secondary' | 'accent'
}

export const ClientButton = forwardRef<HTMLButtonElement, ClientButtonProps>(
  ({ className, enableClientTheme = true, clientVariant = 'primary', variant = 'default', ...props }, ref) => {
    const { isClientThemeActive } = useClientTheme()
    const { getThemedClassName } = useClientThemedStyles()

    const clientThemeClass = enableClientTheme && isClientThemeActive
      ? `client-themed-button ${clientVariant === 'primary' ? '' : clientVariant}`
      : ''

    return (
      <Button
        ref={ref}
        variant={isClientThemeActive && enableClientTheme ? 'default' : variant}
        className={getThemedClassName(
          cn(className),
          clientThemeClass
        )}
        {...props}
      />
    )
  }
)
ClientButton.displayName = 'ClientButton'

// Client-themed Badge component
interface ClientBadgeProps extends BadgeProps {
  enableClientTheme?: boolean
  clientVariant?: 'primary' | 'secondary' | 'accent' | 'outline'
}

export function ClientBadge({
  className,
  enableClientTheme = true,
  clientVariant = 'primary',
  variant = 'default',
  ...props
}: ClientBadgeProps) {
  const { isClientThemeActive } = useClientTheme()
  const { getThemedClassName } = useClientThemedStyles()

  const clientThemeClass = enableClientTheme && isClientThemeActive
    ? `client-themed-badge ${clientVariant}`
    : ''

  return (
    <Badge
      variant={isClientThemeActive && enableClientTheme ? 'default' : variant}
      className={getThemedClassName(
        cn(className),
        clientThemeClass
      )}
      {...props}
    />
  )
}
ClientBadge.displayName = 'ClientBadge'

// Client Brand Logo component
interface ClientLogoProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  fallbackToInitials?: boolean
  showBrandColors?: boolean
}

export function ClientLogo({
  size = 'medium',
  className,
  fallbackToInitials = true,
  showBrandColors = false
}: ClientLogoProps) {
  const { currentClient } = useNavigation()
  const { brandColors } = useClientBrandColors()

  if (!currentClient) return null

  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-sm',
    large: 'w-12 h-12 text-base'
  }

  const logoSizeClasses = {
    small: 'client-logo small',
    medium: 'client-logo',
    large: 'client-logo large'
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {currentClient.logoUrl ? (
        <img
          src={currentClient.logoUrl}
          alt={`${currentClient.brandName} logo`}
          className={logoSizeClasses[size]}
        />
      ) : fallbackToInitials ? (
        <div
          className={cn(
            'rounded-lg flex items-center justify-center text-white font-bold client-brand-indicator',
            sizeClasses[size]
          )}
          style={{ backgroundColor: brandColors[0] || '#3b82f6' }}
        >
          {currentClient.brandName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
        </div>
      ) : null}

      {showBrandColors && brandColors.length > 0 && (
        <div className="client-brand-colors">
          {brandColors.slice(0, 3).map((color, index) => (
            <div
              key={index}
              className="client-brand-color"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Client Brand Header component
interface ClientBrandHeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  children?: React.ReactNode
  className?: string
}

export function ClientBrandHeader({
  showBackButton = false,
  onBack,
  children,
  className
}: ClientBrandHeaderProps) {
  const { currentClient } = useNavigation()
  const { isClientThemeActive } = useClientTheme()

  if (!currentClient) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between p-4 border-b',
        isClientThemeActive ? 'client-header' : 'bg-background border-border',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {showBackButton && (
          <ClientButton
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-current"
          >
            ← Back
          </ClientButton>
        )}

        <div className="flex items-center space-x-3">
          <ClientLogo size="medium" showBrandColors />
          <div>
            <h1 className="font-semibold text-current">{currentClient.brandName}</h1>
            <p className="text-xs opacity-80">Client Workspace</p>
          </div>
        </div>
      </div>

      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </motion.div>
  )
}

// Client Brand Colors Display component
interface ClientBrandColorsProps {
  colors?: string[]
  size?: 'small' | 'medium' | 'large'
  className?: string
  showLabels?: boolean
}

export function ClientBrandColors({
  colors,
  size = 'medium',
  className,
  showLabels = false
}: ClientBrandColorsProps) {
  const { brandColors } = useClientBrandColors()
  const displayColors = colors || brandColors

  if (!displayColors || displayColors.length === 0) return null

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex space-x-1">
        {displayColors.map((color, index) => (
          <div
            key={index}
            className={cn('rounded-full border border-border client-brand-color', sizeClasses[size])}
            style={{ backgroundColor: color }}
            title={showLabels ? `Brand Color ${index + 1}: ${color}` : undefined}
          />
        ))}
      </div>

      {showLabels && (
        <div className="text-xs text-muted-foreground">
          {displayColors.length} brand color{displayColors.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// Client-themed Card component
interface ClientCardProps {
  children: React.ReactNode
  className?: string
  enableClientTheme?: boolean
  variant?: 'default' | 'branded' | 'accent'
}

export function ClientCard({
  children,
  className,
  enableClientTheme = true,
  variant = 'default'
}: ClientCardProps) {
  const { isClientThemeActive } = useClientTheme()
  const { getThemedClassName } = useClientThemedStyles()

  const variantClasses = {
    default: 'bg-card border-border',
    branded: isClientThemeActive ? 'client-bg-gradient-primary text-white' : 'bg-primary text-primary-foreground',
    accent: isClientThemeActive ? 'client-bg-accent client-text-primary' : 'bg-accent text-accent-foreground'
  }

  return (
    <div className={getThemedClassName(
      cn(
        'rounded-lg border p-6 shadow-sm',
        variantClasses[variant],
        className
      ),
      enableClientTheme && isClientThemeActive ? 'client-themed-card' : undefined
    )}>
      {children}
    </div>
  )
}

// Client Workspace Indicator component
export function ClientWorkspaceIndicator() {
  const { currentClient } = useNavigation()
  const { isClientThemeActive } = useClientTheme()

  if (!currentClient || !isClientThemeActive) return null

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex items-center space-x-2 px-3 py-2 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full client-theme-pulse" />
        <ClientLogo size="small" />
        <span className="text-xs font-medium">Client Mode</span>
      </div>
    </motion.div>
  )
}