'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Upload,
  Image,
  FileText,
  Video,
  Music,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'logo' | 'font'
  url: string
  thumbnailUrl?: string
  size: number
  dimensions?: { width: number; height: number }
  uploadedAt: Date
  uploadedBy: string
  tags: string[]
  category: string
  brandColors?: string[]
  isPublic: boolean
}

interface AssetLibraryProps {
  assets?: Asset[]
  onAssetSelect?: (asset: Asset) => void
  onAssetUpload?: (files: FileList) => void
  onAssetDelete?: (assetId: string) => void
  allowMultiSelect?: boolean
  selectedAssets?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  className?: string
}

const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Brand Logo Primary',
    type: 'logo',
    url: '/api/placeholder/400/300',
    thumbnailUrl: '/api/placeholder/200/150',
    size: 245760,
    dimensions: { width: 1200, height: 800 },
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    uploadedBy: 'John Doe',
    tags: ['logo', 'primary', 'brand'],
    category: 'Branding',
    brandColors: ['#3b82f6', '#1e40af'],
    isPublic: true
  },
  {
    id: '2',
    name: 'Product Hero Image',
    type: 'image',
    url: '/api/placeholder/800/600',
    thumbnailUrl: '/api/placeholder/200/150',
    size: 1024000,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Jane Smith',
    tags: ['product', 'hero', 'marketing'],
    category: 'Marketing',
    isPublic: false
  },
  {
    id: '3',
    name: 'Brand Guidelines PDF',
    type: 'document',
    url: '/api/placeholder/document.pdf',
    size: 2048000,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Design Team',
    tags: ['guidelines', 'brand', 'reference'],
    category: 'Documentation',
    isPublic: true
  },
  {
    id: '4',
    name: 'Promotional Video',
    type: 'video',
    url: '/api/placeholder/video.mp4',
    thumbnailUrl: '/api/placeholder/200/150',
    size: 15728640,
    dimensions: { width: 1920, height: 1080 },
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Video Team',
    tags: ['promo', 'video', 'social'],
    category: 'Video',
    isPublic: true
  },
  {
    id: '5',
    name: 'Brand Jingle',
    type: 'audio',
    url: '/api/placeholder/audio.mp3',
    size: 3145728,
    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Audio Team',
    tags: ['jingle', 'audio', 'brand'],
    category: 'Audio',
    isPublic: false
  },
  {
    id: '6',
    name: 'Social Media Template',
    type: 'image',
    url: '/api/placeholder/600/600',
    thumbnailUrl: '/api/placeholder/200/150',
    size: 512000,
    dimensions: { width: 1080, height: 1080 },
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    uploadedBy: 'Social Team',
    tags: ['template', 'social', 'instagram'],
    category: 'Templates',
    isPublic: true
  }
]

const assetTypeIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  logo: Image,
  font: FileText
}

const categories = ['All', 'Branding', 'Marketing', 'Documentation', 'Video', 'Audio', 'Templates']
const sortOptions = [
  { value: 'name-asc', label: 'Name A-Z', icon: SortAsc },
  { value: 'name-desc', label: 'Name Z-A', icon: SortDesc },
  { value: 'date-desc', label: 'Newest First', icon: Calendar },
  { value: 'date-asc', label: 'Oldest First', icon: Calendar },
  { value: 'size-desc', label: 'Largest First', icon: SortDesc },
  { value: 'size-asc', label: 'Smallest First', icon: SortAsc }
]

export default function AssetLibrary({
  assets = mockAssets,
  onAssetSelect,
  onAssetUpload,
  onAssetDelete,
  allowMultiSelect = false,
  selectedAssets = [],
  onSelectionChange,
  className
}: AssetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('date-desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragOver, setIsDragOver] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get all unique tags
  const allTags = Array.from(new Set(assets.flatMap(asset => asset.tags)))

  // Filter and sort assets
  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => asset.tags.includes(tag))

      return matchesSearch && matchesCategory && matchesTags
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-desc':
          return b.uploadedAt.getTime() - a.uploadedAt.getTime()
        case 'date-asc':
          return a.uploadedAt.getTime() - b.uploadedAt.getTime()
        case 'size-desc':
          return b.size - a.size
        case 'size-asc':
          return a.size - b.size
        default:
          return 0
      }
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && onAssetUpload) {
      onAssetUpload(files)
    }
  }, [onAssetUpload])

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && onAssetUpload) {
      onAssetUpload(files)
    }
  }

  const handleAssetClick = (asset: Asset) => {
    if (allowMultiSelect) {
      const newSelection = selectedAssets.includes(asset.id)
        ? selectedAssets.filter(id => id !== asset.id)
        : [...selectedAssets, asset.id]
      onSelectionChange?.(newSelection)
    } else {
      onAssetSelect?.(asset)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const AssetCard = ({ asset }: { asset: Asset }) => {
    const IconComponent = assetTypeIcons[asset.type]
    const isSelected = selectedAssets.includes(asset.id)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -2 }}
        className={cn(
          "group relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:shadow-lg",
          isSelected && "border-primary bg-primary/5"
        )}
        onClick={() => handleAssetClick(asset)}
      >
        {/* Thumbnail */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconComponent className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-1">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Selection Indicator */}
          {allowMultiSelect && (
            <div className="absolute top-2 left-2">
              <div className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background/80 border-border"
              )}>
                {isSelected && <div className="w-2 h-2 bg-current rounded-full" />}
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs">
              <IconComponent className="w-3 h-3 mr-1" />
              {asset.type}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-foreground truncate mb-1">
            {asset.name}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{formatFileSize(asset.size)}</span>
            {asset.dimensions && (
              <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDate(asset.uploadedAt)}
            </span>
            {asset.isPublic ? (
              <Badge variant="outline" className="text-xs">Public</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Private</Badge>
            )}
          </div>

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{asset.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const AssetListItem = ({ asset }: { asset: Asset }) => {
    const IconComponent = assetTypeIcons[asset.type]
    const isSelected = selectedAssets.includes(asset.id)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "flex items-center space-x-4 p-4 bg-card border border-border rounded-lg cursor-pointer transition-all duration-200",
          "hover:border-primary/50 hover:bg-muted/50",
          isSelected && "border-primary bg-primary/5"
        )}
        onClick={() => handleAssetClick(asset)}
      >
        {/* Selection */}
        {allowMultiSelect && (
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-border"
          )}>
            {isSelected && <div className="w-2 h-2 bg-current rounded-full" />}
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <IconComponent className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{asset.name}</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{asset.category}</span>
            <span>•</span>
            <span>{formatFileSize(asset.size)}</span>
            {asset.dimensions && (
              <>
                <span>•</span>
                <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Meta */}
        <div className="text-right text-sm text-muted-foreground">
          <p>{formatDate(asset.uploadedAt)}</p>
          <p className="text-xs">{asset.uploadedBy}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Asset Library</h2>
          <p className="text-muted-foreground">
            {filteredAssets.length} of {assets.length} assets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-muted")}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="w-4 h-4" />
            ) : (
              <Grid3X3 className="w-4 h-4" />
            )}
          </Button>

          <Button onClick={handleFileSelect}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Assets
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/50 rounded-lg p-4 space-y-4"
            >
              {/* Categories */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Sort by</label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={sortBy === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(option.value)}
                    >
                      <option.icon className="w-3 h-3 mr-1" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors duration-200",
          isDragOver && "border-primary bg-primary/5",
          "hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Drop files here or click to upload
        </h3>
        <p className="text-muted-foreground">
          Support for images, videos, documents, and more
        </p>
      </div>

      {/* Assets Grid/List */}
      <div className="space-y-4">
        {filteredAssets.length > 0 ? (
          viewMode === 'grid' ? (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            >
              <AnimatePresence>
                {filteredAssets.map(asset => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div layout className="space-y-2">
              <AnimatePresence>
                {filteredAssets.map(asset => (
                  <AssetListItem key={asset.id} asset={asset} />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          <div className="text-center py-12">
            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters, or upload some assets to get started.
            </p>
            <Button onClick={handleFileSelect}>
              <Plus className="w-4 h-4 mr-2" />
              Upload First Asset
            </Button>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload asset files"
        title="Upload asset files"
      />
    </div>
  )
}