'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Image, 
  Upload, 
  Grid3X3, 
  Search, 
  Filter,
  Sparkles,
  FolderOpen,
  Tag,
  Users
} from 'lucide-react'
import AssetLibrary from '@/components/client/asset-library'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

export default function AssetLibraryDemo() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset)
    console.log('Selected asset:', asset)
  }

  const handleAssetUpload = (files: FileList) => {
    console.log('Uploading files:', Array.from(files).map(f => f.name))
    // Here you would handle the actual upload
  }

  const handleAssetDelete = (assetId: string) => {
    console.log('Deleting asset:', assetId)
    // Here you would handle the actual deletion
  }

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedAssets(selectedIds)
    console.log('Selection changed:', selectedIds)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Asset Library Demo</h1>
              <p className="text-muted-foreground mt-1">
                Visual asset management with search, filters, and drag & drop upload
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Asset Library */}
          <div className="lg:col-span-3">
            <AssetLibrary
              onAssetSelect={handleAssetSelect}
              onAssetUpload={handleAssetUpload}
              onAssetDelete={handleAssetDelete}
              allowMultiSelect={true}
              selectedAssets={selectedAssets}
              onSelectionChange={handleSelectionChange}
            />
          </div>

          {/* Sidebar with Info and Actions */}
          <div className="space-y-6">
            {/* Selection Info */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Selection</h3>
              </div>
              
              {selectedAssets.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
                  </p>
                  
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Download
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="destructive" size="sm" className="w-full">
                      Delete Selected
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No assets selected. Click on assets to select them.
                </p>
              )}
            </Card>

            {/* Selected Asset Details */}
            {selectedAsset && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedAsset.id}
              >
                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Image className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Asset Details</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {selectedAsset.thumbnailUrl ? (
                        <img 
                          src={selectedAsset.thumbnailUrl} 
                          alt={selectedAsset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">{selectedAsset.name}</h4>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Type: {selectedAsset.type}</p>
                        <p>Category: {selectedAsset.category}</p>
                        <p>Size: {(selectedAsset.size / 1024 / 1024).toFixed(2)} MB</p>
                        {selectedAsset.dimensions && (
                          <p>Dimensions: {selectedAsset.dimensions.width}×{selectedAsset.dimensions.height}</p>
                        )}
                        <p>Uploaded by: {selectedAsset.uploadedBy}</p>
                        <p>
                          Uploaded: {selectedAsset.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>

                      {/* Tags */}
                      {selectedAsset.tags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedAsset.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Brand Colors */}
                      {selectedAsset.brandColors && selectedAsset.brandColors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Brand Colors</p>
                          <div className="flex space-x-2">
                            {selectedAsset.brandColors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded border border-border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Edit Details
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Share
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Quick Stats */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Library Stats</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Assets</span>
                  <Badge variant="secondary">6</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Images</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Videos</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Documents</span>
                  <Badge variant="outline">1</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Audio</span>
                  <Badge variant="outline">1</Badge>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Size</span>
                  <Badge variant="secondary">22.4 MB</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">AssetLibrary Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Grid3X3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Visual Grid & List Views</h4>
              <p className="text-sm text-muted-foreground">Switch between grid and list layouts</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Search className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Advanced Search & Filters</h4>
              <p className="text-sm text-muted-foreground">Find assets by name, tags, or category</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Drag & Drop Upload</h4>
              <p className="text-sm text-muted-foreground">Easy file upload with preview</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium mb-1">Multi-Select Actions</h4>
              <p className="text-sm text-muted-foreground">Bulk operations on multiple assets</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}