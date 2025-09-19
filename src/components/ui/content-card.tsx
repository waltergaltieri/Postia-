import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Download,
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { Button } from "./button"
import { OptimizedImage } from "./optimized-image"

const contentCardVariants = cva(
  "group relative overflow-hidden",
  {
    variants: {
      status: {
        draft: "border-status-draft/30",
        pending: "border-status-pending/30",
        approved: "border-status-approved/30",
        published: "border-status-published/30",
        error: "border-status-error/30"
      },
      contentType: {
        image: "aspect-square",
        video: "aspect-video",
        text: "aspect-[4/3]",
        carousel: "aspect-[4/3]"
      }
    },
    defaultVariants: {
      status: "draft",
      contentType: "image"
    }
  }
)

// Status configuration
const statusConfig = {
  draft: {
    icon: Clock,
    label: "Borrador",
    color: "text-status-draft",
    bgColor: "bg-status-draft/10",
    borderColor: "border-status-draft/20"
  },
  pending: {
    icon: AlertCircle,
    label: "Pendiente",
    color: "text-status-pending",
    bgColor: "bg-status-pending/10",
    borderColor: "border-status-pending/20"
  },
  approved: {
    icon: CheckCircle2,
    label: "Aprobado",
    color: "text-status-approved",
    bgColor: "bg-status-approved/10",
    borderColor: "border-status-approved/20"
  },
  published: {
    icon: Calendar,
    label: "Publicado",
    color: "text-status-published",
    bgColor: "bg-status-published/10",
    borderColor: "border-status-published/20"
  },
  error: {
    icon: XCircle,
    label: "Error",
    color: "text-status-error",
    bgColor: "bg-status-error/10",
    borderColor: "border-status-error/20"
  }
}

// CSS classes for animations
const overlayClasses = {
  hidden: "opacity-0 translate-y-2",
  visible: "opacity-100 translate-y-0"
}

const actionButtonClasses = {
  hidden: "opacity-0 scale-90",
  visible: "opacity-100 scale-100"
}

export interface ContentCardAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "secondary"
  disabled?: boolean
}

export interface ContentCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    VariantProps<typeof contentCardVariants> {
  // Content props
  title: string
  description?: string
  thumbnail?: string
  contentType: "image" | "video" | "text" | "carousel"
  
  // Status and metadata
  status: "draft" | "pending" | "approved" | "published" | "error"
  createdAt?: Date
  scheduledAt?: Date
  platform?: string
  
  // Actions
  actions?: ContentCardAction[]
  onView?: () => void
  onEdit?: () => void
  onSelect?: (selected: boolean) => void
  
  // State
  selected?: boolean
  loading?: boolean
  
  // Display options
  showOverlay?: boolean
  showStatus?: boolean
  showMetadata?: boolean
}

const ContentCard = React.forwardRef<HTMLDivElement, ContentCardProps>(
  ({ 
    className,
    title,
    description,
    thumbnail,
    contentType,
    status,
    createdAt,
    scheduledAt,
    platform,
    actions = [],
    onView,
    onEdit,
    onSelect,
    selected = false,
    loading = false,
    showOverlay = true,
    showStatus = true,
    showMetadata = true,
    ...props 
  }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const statusInfo = statusConfig[status]
    const StatusIcon = statusInfo.icon

    // Default actions if none provided
    const defaultActions: ContentCardAction[] = [
      ...(onView ? [{ icon: Eye, label: "Ver", onClick: onView }] : []),
      ...(onEdit ? [{ icon: Edit3, label: "Editar", onClick: onEdit }] : []),
      { icon: Copy, label: "Duplicar", onClick: () => {} },
      { icon: Share2, label: "Compartir", onClick: () => {} },
      { icon: Download, label: "Descargar", onClick: () => {} },
      { icon: Trash2, label: "Eliminar", onClick: () => {}, variant: "destructive" as const }
    ]

    const finalActions = actions.length > 0 ? actions : defaultActions

    const handleCardClick = () => {
      if (onView) onView()
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (onSelect) onSelect(e.target.checked)
    }

    return (
      <Card
        ref={ref}
        variant="interactive"
        size="sm"
        className={cn(
          contentCardVariants({ status, contentType }),
          selected && "ring-2 ring-primary-500 ring-offset-2",
          loading && "opacity-60",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        {...props}
      >
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 z-20 responsive-container">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
              className="w-4 h-4 rounded border-2 border-white/80 bg-black/20 backdrop-blur-sm text-primary-600 focus:ring-primary-500 focus:ring-offset-0 responsive-container"
              aria-label={`Seleccionar ${title}`}
            />
          </div>
        )}

        {/* Status indicator */}
        {showStatus && (
          <div className={cn(
            "absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
            statusInfo.bgColor,
            statusInfo.borderColor,
            statusInfo.color,
            "border"
          )}>
            <StatusIcon className="w-3 h-3 responsive-container" />
            {statusInfo.label}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm responsive-container">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 rounded-lg text-sm font-medium responsive-container">
              <Loader2 className="w-4 h-4 animate-spin responsive-container" />
              Procesando...
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="relative w-full h-full responsive-container">
          {/* Thumbnail or content preview */}
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden responsive-container">
            {thumbnail ? (
              <OptimizedImage
                src={thumbnail}
                alt={title}
                fill
                objectFit="cover"
                quality={80}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="rounded-lg responsive-container"
                lazy={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center responsive-container">
                <div className="text-center p-4 responsive-container">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center responsive-container">
                    {contentType === 'image' && <Eye className="w-6 h-6 text-primary-600 responsive-container" />}
                    {contentType === 'video' && <Calendar className="w-6 h-6 text-primary-600 responsive-container" />}
                    {contentType === 'text' && <Edit3 className="w-6 h-6 text-primary-600 responsive-container" />}
                    {contentType === 'carousel' && <Copy className="w-6 h-6 text-primary-600 responsive-container" />}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground responsive-container">
                    {contentType === 'image' && 'Imagen'}
                    {contentType === 'video' && 'Video'}
                    {contentType === 'text' && 'Texto'}
                    {contentType === 'carousel' && 'Carrusel'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hover overlay with actions */}
          {showOverlay && (
            <div
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-between p-4 transition-all duration-300",
                isHovered ? overlayClasses.visible : overlayClasses.hidden
              )}
            >
              {/* Quick actions */}
              <div 
                className={cn(
                  "flex justify-end gap-2 transition-all duration-200 delay-75",
                  isHovered ? actionButtonClasses.visible : actionButtonClasses.hidden
                )}
              >
                {finalActions.slice(0, 3).map((action, index) => {
                  const ActionIcon = action.icon
                  return (
                    <Button
                      key={index}
                      size="icon-sm"
                      variant={action.variant || "secondary"}
                      className="bg-white/90 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-sm responsive-container"
                      onClick={(e) => <span>{
                        e.stopPropagation()
                        action.onClick()
                      }}
                      disabled={action.disabled}
                    ></span><ActionIcon className="w-4 h-4 responsive-container" />
                    </Button>
                  )
                })}
                
                {finalActions.length > 3 && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-sm responsive-container"
                    onClick={(e) => <span>e.stopPropagation()}
                  ></span><MoreHorizontal className="w-4 h-4 responsive-container" />
                  </Button>
                )}
              </div>

              {/* Content info */}
              <div 
                className={cn(
                  "text-white transition-all duration-200 delay-100",
                  isHovered ? actionButtonClasses.visible : actionButtonClasses.hidden
                )}
              >
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 responsive-container">{title}</h3>
                {description && (
                  <p className="text-xs text-white/80 line-clamp-2 mb-2 responsive-container">{description}</p>
                )}
                
                {showMetadata && (
                  <div className="flex items-center gap-3 text-xs text-white/70 responsive-container">
                    {platform && (
                      <span className="px-2 py-1 bg-white/20 rounded-full responsive-container">
                        {platform}
                      </span>
                    )}
                    {createdAt && (
                      <span>
                        {createdAt.toLocaleDateString()}
                      </span>
                    )}
                    {scheduledAt && (
                      <span className="flex items-center gap-1 responsive-container">
                        <Calendar className="w-3 h-3 responsive-container" />
                        {scheduledAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }
)
ContentCard.displayName = "ContentCard"

export { ContentCard, contentCardVariants }