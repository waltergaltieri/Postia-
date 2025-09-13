'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CampaignGeneratorProps {
  clients: any[]
  agencyId: string
  userId: string
}

export default function CampaignGenerator({ clients, agencyId, userId }: CampaignGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [config, setConfig] = useState({
    clientId: '',
    campaignId: '',
    contentCount: 20,
    platforms: ['instagram', 'facebook', 'twitter'],
    contentMix: {
      textOnly: 30,
      singleImage: 50,
      carousel: 15,
      video: 5
    },
    dateRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  })

  const selectedClient = clients.find(c => c.id === config.clientId)

  const generateCampaign = async () => {
    if (!config.clientId) {
      alert('Please select a client')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log('🚀 Starting real campaign generation with AI...')
      
      const response = await fetch(`/api/campaigns/${config.campaignId || 'new'}/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: config.clientId,
          contentCount: config.contentCount,
          dateRange: config.dateRange,
          platforms: config.platforms,
          contentMix: config.contentMix,
          autoSchedule: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Campaign generated successfully!')
        setResult(data.data)
      } else {
        throw new Error(data.error?.message || 'Failed to generate campaign')
      }
    } catch (error) {
      console.error('❌ Campaign generation failed:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Campaign Generated Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{result.summary.totalPosts}</div>
                <div className="text-sm text-gray-600">Posts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">${result.summary.totalCost}</div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.floor(result.summary.generationTime / 1000)}s</div>
                <div className="text-sm text-gray-600">Generation Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{result.metadata.tokensConsumed}</div>
                <div className="text-sm text-gray-600">Tokens Used</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Generated Content Preview</h3>
              {result.publications.slice(0, 5).map((pub: any, index: number) => (
                <div key={pub.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {pub.platform}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                        {pub.contentType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(pub.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{pub.content.text}</p>
                  {pub.content.hashtags && (
                    <div className="flex flex-wrap gap-1">
                      {pub.content.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex space-x-4">
              <Button onClick={() => setResult(null)}>
                Generate Another Campaign
              </Button>
              <Button variant="outline">
                View Full Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Client</label>
            <select
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value, campaignId: '' })}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Selection */}
          {selectedClient && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Campaign (Optional)</label>
              <select
                value={config.campaignId}
                onChange={(e) => setConfig({ ...config, campaignId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Create new campaign content</option>
                {selectedClient.campaigns.map((campaign: any) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Content Count */}
          <div>
            <label className="block text-sm font-medium mb-2">Number of Posts</label>
            <Input
              type="number"
              value={config.contentCount}
              onChange={(e) => setConfig({ ...config, contentCount: parseInt(e.target.value) || 20 })}
              min="5"
              max="100"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={config.dateRange.startDate}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, startDate: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={config.dateRange.endDate}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, endDate: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {['instagram', 'facebook', 'twitter', 'linkedin'].map(platform => (
                <label key={platform} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.platforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          platforms: [...config.platforms, platform]
                        })
                      } else {
                        setConfig({
                          ...config,
                          platforms: config.platforms.filter(p => p !== platform)
                        })
                      }
                    }}
                  />
                  <span className="capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Mix */}
          <div>
            <label className="block text-sm font-medium mb-4">Content Mix (%)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Only</label>
                <Input
                  type="number"
                  value={config.contentMix.textOnly}
                  onChange={(e) => setConfig({
                    ...config,
                    contentMix: { ...config.contentMix, textOnly: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Single Image</label>
                <Input
                  type="number"
                  value={config.contentMix.singleImage}
                  onChange={(e) => setConfig({
                    ...config,
                    contentMix: { ...config.contentMix, singleImage: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Carousel</label>
                <Input
                  type="number"
                  value={config.contentMix.carousel}
                  onChange={(e) => setConfig({
                    ...config,
                    contentMix: { ...config.contentMix, carousel: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Video</label>
                <Input
                  type="number"
                  value={config.contentMix.video}
                  onChange={(e) => setConfig({
                    ...config,
                    contentMix: { ...config.contentMix, video: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Estimation */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Estimation:</h4>
            <div className="text-sm space-y-1">
              <p>📊 Posts: <strong>{config.contentCount}</strong></p>
              <p>💰 Estimated cost: <strong>${(config.contentCount * 0.08).toFixed(2)}</strong></p>
              <p>⏱️ Estimated time: <strong>~{Math.ceil(config.contentCount / 4)} minutes</strong></p>
              <p>🎯 Platforms: <strong>{config.platforms.join(', ')}</strong></p>
            </div>
          </div>

          <Button 
            onClick={generateCampaign}
            disabled={loading || !config.clientId}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Campaign with AI...
              </>
            ) : (
              '🚀 Generate Campaign Content'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}