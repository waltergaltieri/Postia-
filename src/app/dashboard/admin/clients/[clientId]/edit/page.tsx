'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Palette,
  Building2,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ClientFormData {
  id: string
  name: string
  brandName: string
  description: string
  website: string
  industry: string
  brandColors: string[]
  logoUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  isActive: boolean
}

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Food & Beverage',
  'Travel & Tourism',
  'Entertainment',
  'Non-profit',
  'Other'
]

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState<ClientFormData | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`)
      const result = await response.json()

      if (result.success) {
        const client = result.data.client
        setFormData({
          id: client.id,
          name: client.name || '',
          brandName: client.brandName || '',
          description: client.description || '',
          website: client.website || '',
          industry: client.industry || '',
          brandColors: client.brandColors ? JSON.parse(client.brandColors) : ['#3b82f6'],
          logoUrl: client.logoUrl || '',
          contactEmail: client.contactEmail || '',
          contactPhone: client.contactPhone || '',
          address: client.address || '',
          isActive: client.isActive
        })
      }
    } catch (error) {
      console.error('Error fetching client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    if (!formData) return

    setFormData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null)
  }

  const handleColorAdd = (color: string) => {
    if (!formData) return

    if (!formData.brandColors.includes(color) && formData.brandColors.length < 5) {
      setFormData(prev => prev ? ({
        ...prev,
        brandColors: [...prev.brandColors, color]
      }) : null)
    }
  }

  const handleColorRemove = (colorToRemove: string) => {
    if (!formData) return

    if (formData.brandColors.length > 1) {
      setFormData(prev => prev ? ({
        ...prev,
        brandColors: prev.brandColors.filter(color => color !== colorToRemove)
      }) : null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        router.push('/dashboard/admin/clients')
      } else {
        console.error('Error updating client:', result.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error updating client:', error)
      // TODO: Show error toast
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!formData) return

    if (!confirm(`Are you sure you want to delete "${formData.brandName || formData.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/dashboard/admin/clients')
      } else {
        console.error('Error deleting client')
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      // TODO: Show error toast
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/admin/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update {formData.brandName || formData.name}'s information
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Client
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Client Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive ? 'Client is currently active' : 'Client is currently inactive'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={formData.isActive ? "default" : "outline"}
                  onClick={() => handleInputChange('isActive', !formData.isActive)}
                >
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    placeholder="Acme"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the client's business..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <select
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    title="Select the client's industry"
                    aria-label="Client industry selection"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Brand Assets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Brand Assets
              </CardTitle>
              <CardDescription>
                Visual identity and branding elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Colors</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.brandColors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <div
                        className="w-8 h-8 rounded border-2 border-border"
                        style={{ backgroundColor: color }}
                      />
                      <Badge variant="secondary" className="text-xs">
                        {color}
                        {formData.brandColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleColorRemove(color)}
                            className="ml-1 hover:text-destructive"
                            title={`Remove color ${color}`}
                            aria-label={`Remove brand color ${color}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>

                {formData.brandColors.length < 5 && (
                  <div className="flex flex-wrap gap-2">
                    {defaultColors
                      .filter(color => !formData.brandColors.includes(color))
                      .map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorAdd(color)}
                          className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                          style={{ backgroundColor: color }}
                          title={`Add color ${color}`}
                          aria-label={`Add brand color ${color}`}
                        />
                      ))
                    }
                    <input
                      type="color"
                      onChange={(e) => handleColorAdd(e.target.value)}
                      className="w-8 h-8 rounded border-2 border-border cursor-pointer"
                      title="Pick custom color"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Primary contact details for the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@client.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end space-x-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}