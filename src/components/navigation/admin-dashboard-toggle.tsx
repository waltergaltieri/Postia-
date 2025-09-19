'use client'

import { motion } from 'framer-motion'
import { 
  Building2, 
  Settings, 
  BarChart3, 
  Shield, 
  Zap,
  Check,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useNavigation } from './navigation-context'

interface AdminDashboardToggleProps {
  className?: string
  variant?: 'full' | 'compact' | 'minimal'
  showTransition?: boolean
  onToggle?: () => void
}

export default function AdminDashboardToggle({
  className,
  variant = 'full',
  showTransition = true,
  onToggle
}: AdminDashboardToggleProps) {
  const { clientWorkspaceMode, switchToAdminDashboard } = useNavigation()
  
  const isActive = clientWorkspaceMode === 'admin'

  const handleToggle = () => {
    switchToAdminDashboard()
    onToggle?.()
  }

  const iconVariants = {
    inactive: { rotate: 0, scale: 1 },
    active: { rotate: 360, scale: 1.1 }
  }

  const badgeVariants = {
    inactive: { scale: 0.9, opacity: 0.7 },
    active: { scale: 1, opacity: 1 }
  }

  if (variant === 'minimal') {
    return (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        size="icon"
        className={cn(
          "relative transition-all duration-300",
          isActive && "shadow-lg shadow-primary/20",
          className
        )}
        onClick={handleToggle}
      >
        <motion.div
          variants={iconVariants}
          animate={isActive ? 'active' : 'inactive'}
          transition={{ duration: 0.3 }}
        >
          <Building2 className="w-4 h-4" />
        </motion.div>
        
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
          />
        )}
      </Button>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={className}
      >
        <Button
          variant={isActive ? 'default' : 'outline'}
          className={cn(
            "w-full justify-start space-x-3 transition-all duration-300",
            isActive && "shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90"
          )}
          onClick={handleToggle}
        >
          <motion.div
            variants={iconVariants}
            animate={isActive ? 'active' : 'inactive'}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Building2 className="w-4 h-4" />
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
              />
            )}
          </motion.div>
          
          <span className="font-medium">Admin Dashboard</span>
          
          {isActive && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </Button>
      </motion.div>
    )
  }

  // Full variant
  return (
    <motion.div
      whileHover={{ scale: showTransition ? 1.01 : 1 }}
      whileTap={{ scale: showTransition ? 0.99 : 1 }}
      className={className}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-auto p-4 transition-all duration-300 group",
          isActive && "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10"
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-4 w-full">
          {/* Icon with animation */}
          <div className="relative flex-shrink-0">
            <motion.div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg shadow-primary/30" 
                  : "bg-gradient-to-br from-muted to-muted/80 group-hover:from-primary/20 group-hover:to-primary/10"
              )}
              variants={iconVariants}
              animate={isActive ? 'active' : 'inactive'}
              transition={{ duration: 0.3 }}
            >
              <Building2 className={cn(
                "w-6 h-6 transition-colors duration-300",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
              )} />
            </motion.div>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </motion.div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={cn(
                "font-semibold transition-colors duration-300",
                isActive ? "text-primary" : "text-foreground"
              )}>
                Admin Dashboard
              </h3>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <Check className="w-4 h-4 text-primary" />
                </motion.div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              Manage all clients, users, and system settings
            </p>

            {/* Feature indicators */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  variants={badgeVariants}
                  animate={isActive ? 'active' : 'inactive'}
                  className="flex items-center space-x-1"
                >
                  <Settings className="w-3 h-3 text-muted-foreground" />
                  <BarChart3 className="w-3 h-3 text-muted-foreground" />
                  <Shield className="w-3 h-3 text-muted-foreground" />
                </motion.div>
              </div>
              
              <motion.div
                variants={badgeVariants}
                animate={isActive ? 'active' : 'inactive'}
              >
                <Badge 
                  variant={isActive ? 'default' : 'secondary'} 
                  className={cn(
                    "text-xs transition-all duration-300",
                    isActive && "shadow-sm"
                  )}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              </motion.div>
            </div>
          </div>
          
          {/* Arrow indicator */}
          <motion.div
            animate={{ 
              x: isActive ? 0 : -5,
              opacity: isActive ? 1 : 0.5
            }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronRight className={cn(
              "w-5 h-5 transition-colors duration-300",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
          </motion.div>
        </div>
      </Button>
    </motion.div>
  )
}