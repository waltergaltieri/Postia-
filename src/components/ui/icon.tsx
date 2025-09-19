'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

// Icon size system - standardized sizes for consistency
const iconVariants = cva(
  "inline-flex items-center justify-center shrink-0 transition-colors",
  {
    variants: {
      size: {
        xs: "h-3 w-3", // 12px - Very small icons (indicators, bullets)
        sm: "h-4 w-4", // 16px - Small icons (inline text, compact UI)
        md: "h-5 w-5", // 20px - Default size (buttons, navigation)
        lg: "h-6 w-6", // 24px - Large icons (headers, prominent actions)
        xl: "h-8 w-8", // 32px - Extra large (hero sections, empty states)
      },
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        success: "text-success-600 dark:text-success-400",
        warning: "text-warning-600 dark:text-warning-400",
        error: "text-error-600 dark:text-error-400",
        info: "text-info-600 dark:text-info-400",
        white: "text-white",
        inherit: "text-inherit",
      },
      state: {
        default: "",
        hover: "hover:opacity-80 transition-opacity",
        active: "active:scale-95 transition-transform",
        disabled: "opacity-50 cursor-not-allowed",
        loading: "animate-pulse",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      state: "default",
    },
  }
)

// Context-specific icon size mappings
export const ICON_CONTEXTS = {
  navigation: {
    sidebar: "md", // h-5 for sidebar navigation
    breadcrumb: "sm", // h-4 for breadcrumbs
    tabs: "sm", // h-4 for tab icons
    dropdown: "sm", // h-4 for dropdown items
  },
  buttons: {
    small: "xs", // h-3 for small buttons
    default: "sm", // h-4 for default buttons
    large: "md", // h-5 for large buttons
    icon: "md", // h-5 for icon-only buttons
  },
  status: {
    indicator: "xs", // h-3 for status dots/indicators
    badge: "xs", // h-3 for badge icons
    notification: "sm", // h-4 for notification icons
    alert: "md", // h-5 for alert icons
  },
  content: {
    inline: "sm", // h-4 for inline content icons
    card: "md", // h-5 for card headers
    hero: "xl", // h-8 for hero sections
    empty: "xl", // h-8 for empty states
  },
  form: {
    input: "sm", // h-4 for input icons
    label: "xs", // h-3 for label icons
    validation: "sm", // h-4 for validation icons
  }
} as const

// Status icon color mappings
export const STATUS_COLORS = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
  pending: "warning",
  active: "success",
  inactive: "muted",
  disabled: "muted",
} as const

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size">,
  VariantProps<typeof iconVariants> {
  name: keyof typeof LucideIcons
  context?: keyof typeof ICON_CONTEXTS | string
  status?: keyof typeof STATUS_COLORS
  "aria-label"?: string
  "aria-hidden"?: boolean
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({
    name,
    size,
    variant,
    state,
    context,
    status,
    className,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHidden = true,
    ...props
  }, ref) => {
    // Get the Lucide icon component
    const LucideIcon = LucideIcons[name] as React.ComponentType<any>

    if (!LucideIcon) {
      console.warn(`Icon "${name}" not found in lucide-react`)
      return null
    }

    // Determine size based on context if not explicitly provided
    let resolvedSize = size
    if (!size && context && typeof context === 'string') {
      const contextParts = context.split('.')
      if (contextParts.length === 2) {
        const [contextType, contextSubtype] = contextParts
        const contextConfig = ICON_CONTEXTS[contextType as keyof typeof ICON_CONTEXTS]
        if (contextConfig && typeof contextConfig === 'object') {
          resolvedSize = (contextConfig as any)[contextSubtype] || 'md'
        }
      } else if (ICON_CONTEXTS[context as keyof typeof ICON_CONTEXTS]) {
        resolvedSize = 'md' // Default for context categories
      }
    }

    // Determine variant based on status if provided
    let resolvedVariant = variant
    if (!variant && status && STATUS_COLORS[status]) {
      resolvedVariant = STATUS_COLORS[status]
    }

    // Enhanced accessibility
    const accessibilityProps = {
      'aria-label': ariaLabel,
      'aria-hidden': ariaHidden && !ariaLabel,
      role: ariaLabel ? 'img' : undefined,
      ...props
    }

    return (
      <LucideIcon
        ref={ref}
        className={cn(iconVariants({
          size: resolvedSize,
          variant: resolvedVariant,
          state
        }), className)}
        {...accessibilityProps}
      />
    )
  }
)

Icon.displayName = "Icon"

// Convenience components for common icon patterns
export const StatusIcon = React.forwardRef<SVGSVGElement,
  Omit<IconProps, 'variant'> & { status: keyof typeof STATUS_COLORS }
>(({ status, ...props }, ref) => (
  <Icon ref={ref} variant={STATUS_COLORS[status]} {...props} />
))

StatusIcon.displayName = "StatusIcon"

export const NavigationIcon = React.forwardRef<SVGSVGElement,
  Omit<IconProps, 'size' | 'context'> & {
    context: 'sidebar' | 'breadcrumb' | 'tabs' | 'dropdown'
  }
>(({ context, ...props }, ref) => (
  <Icon
    ref={ref}
    size={ICON_CONTEXTS.navigation[context]}
    context={`navigation.${context}`}
    {...props}
  />
))

NavigationIcon.displayName = "NavigationIcon"

export const ButtonIcon = React.forwardRef<SVGSVGElement,
  Omit<IconProps, 'size' | 'context'> & {
    context: 'small' | 'default' | 'large' | 'icon'
  }
>(({ context, ...props }, ref) => (
  <Icon
    ref={ref}
    size={ICON_CONTEXTS.buttons[context]}
    context={`buttons.${context}`}
    {...props}
  />
))

ButtonIcon.displayName = "ButtonIcon"

// Icon registry for commonly used icons with semantic names
export const SEMANTIC_ICONS = {
  // Navigation
  home: "Home",
  dashboard: "LayoutDashboard",
  users: "Users",
  settings: "Settings",
  profile: "User",
  logout: "LogOut",
  menu: "Menu",
  close: "X",
  back: "ArrowLeft",
  forward: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",

  // Actions
  add: "Plus",
  edit: "Edit",
  delete: "Trash2",
  save: "Save",
  cancel: "X",
  confirm: "Check",
  search: "Search",
  filter: "Filter",
  sort: "ArrowUpDown",
  refresh: "RefreshCw",
  download: "Download",
  upload: "Upload",
  copy: "Copy",
  share: "Share",

  // Status
  success: "CheckCircle",
  error: "XCircle",
  warning: "AlertTriangle",
  info: "Info",
  loading: "Loader2",
  pending: "Clock",

  // Content
  image: "Image",
  file: "File",
  folder: "Folder",
  document: "FileText",
  video: "Video",
  audio: "Music",
  link: "ExternalLink",

  // UI Elements
  chevronLeft: "ChevronLeft",
  chevronRight: "ChevronRight",
  chevronUp: "ChevronUp",
  chevronDown: "ChevronDown",
  expand: "Expand",
  collapse: "Minimize",
  fullscreen: "Maximize",

  // Social/Communication
  email: "Mail",
  phone: "Phone",
  message: "MessageSquare",
  notification: "Bell",
  calendar: "Calendar",

} as const

export { Icon, iconVariants }