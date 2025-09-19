'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIGenerationWorkflow from '@/components/content/AIGenerationWorkflow';
import ContentVersionComparator from '@/components/content/ContentVersionComparator';
import { 
  Sparkles, 
  ArrowLeftRight, 
  Play, 
  RotateCcw,
  Zap,
  User,
  Copy
} from 'lucide-react';

// Mock data for demonstration
const mockJob = {
  id: 'job-123',
  status: 'IN_PROGRESS' as const,
  tokensConsumed: 1250,
  estimatedTotalTokens: 2000,
  createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
  steps: [
    {
      step: 'IDEA_GENERATION' as const,
      status: 'COMPLETED' as const,
      tokensUsed: 150,
      executedAt: new Date(Date.now() - 110000).toISOString(),
      output: 'Creative concept for summer fashion campaign',
      duration: 8000
    },
    {
      step: 'COPY_DESIGN' as const,
      status: 'COMPLETED' as const,
      tokensUsed: 300,
      executedAt: new Date(Date.now() - 90000).toISOString(),
      output: 'Engaging copy for design elements',
      duration: 12000
    },
    {
      step: 'COPY_PUBLICATION' as const,
      status: 'IN_PROGRESS' as const,
      tokensUsed: 200,
      estimatedTokens: 400,
      duration: 15000
    },
    {
      step: 'BASE_IMAGE' as const,
      status: 'PENDING' as const,
      tokensUsed: 0,
      estimatedTokens: 600
    },
    {
      step: 'FINAL_DESIGN' as const,
      status: 'PENDING' as const,
      tokensUsed: 0,
      estimatedTokens: 800
    }
  ],
  brandContext: {
    clientName: 'Fashion Forward',
    brandColors: ['#FF6B6B', '#4ECDC4', '#45B7D1']
  }
};

const mockVersions = [
  {
    id: 'v1',
    versionNumber: 1,
    finalImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    publicationText: 'Discover the latest summer trends that will make you shine! ✨ Our new collection combines comfort with style, perfect for those sunny days ahead. #SummerFashion #StyleGoals',
    hashtags: ['SummerFashion', 'StyleGoals', 'TrendAlert', 'FashionForward'],
    cta: 'Shop the collection now!',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    createdBy: { id: 'user1', name: 'Sarah Johnson' },
    isActive: false,
    tokensUsed: 850,
    generationMethod: 'AI' as const,
    changesSummary: 'Initial AI generation with summer theme',
    generationSteps: [
      { step: 'IDEA_GENERATION', status: 'COMPLETED' as const, tokensUsed: 150, output: 'Summer fashion concept' },
      { step: 'COPY_DESIGN', status: 'COMPLETED' as const, tokensUsed: 200, output: 'Design copy' },
      { step: 'COPY_PUBLICATION', status: 'COMPLETED' as const, tokensUsed: 250, output: 'Publication text' },
      { step: 'BASE_IMAGE', status: 'COMPLETED' as const, tokensUsed: 250, output: 'Base image generated' }
    ],
    changeType: 'REGENERATION' as const
  },
  {
    id: 'v2',
    versionNumber: 2,
    finalImageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
    publicationText: 'Summer vibes are here! 🌞 Embrace the season with our carefully curated collection that blends timeless elegance with contemporary flair. Every piece tells a story of confidence and grace.',
    hashtags: ['SummerVibes', 'ElegantStyle', 'TimelessFashion', 'ConfidentWomen'],
    cta: 'Explore the collection',
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    createdBy: { id: 'user2', name: 'Mike Chen' },
    isActive: false,
    tokensUsed: 0,
    generationMethod: 'MANUAL' as const,
    changesSummary: 'Manual refinement focusing on elegance',
    parentVersionId: 'v1',
    changeType: 'MANUAL_EDIT' as const
  },
  {
    id: 'v3',
    versionNumber: 3,
    finalImageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop',
    publicationText: 'Ready to turn heads this summer? 💫 Our exclusive collection features bold patterns and vibrant colors that celebrate your unique style. Be fearless, be fabulous! #BoldFashion #SummerStyle',
    hashtags: ['BoldFashion', 'SummerStyle', 'VibrantColors', 'UniqueFashion', 'FearlessFashion'],
    cta: 'Be bold - shop now!',
    createdAt: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
    createdBy: { id: 'user1', name: 'Sarah Johnson' },
    isActive: true,
    tokensUsed: 920,
    generationMethod: 'AI' as const,
    changesSummary: 'AI regeneration with bold, vibrant theme',
    generationSteps: [
      { step: 'IDEA_GENERATION', status: 'COMPLETED' as const, tokensUsed: 180, output: 'Bold summer concept' },
      { step: 'COPY_DESIGN', status: 'COMPLETED' as const, tokensUsed: 220, output: 'Bold design copy' },
      { step: 'COPY_PUBLICATION', status: 'COMPLETED' as const, tokensUsed: 270, output: 'Vibrant publication text' },
      { step: 'BASE_IMAGE', status: 'COMPLETED' as const, tokensUsed: 250, output: 'Bold image generated' }
    ],
    parentVersionId: 'v2',
    changeType: 'REGENERATION' as const
  },
  {
    id: 'v4',
    versionNumber: 4,
    finalImageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop',
    publicationText: 'Minimalist meets modern in our latest summer drop 🤍 Clean lines, premium fabrics, and effortless sophistication. For those who appreciate the beauty in simplicity.',
    hashtags: ['MinimalistFashion', 'ModernStyle', 'PremiumQuality', 'EffortlessStyle'],
    cta: 'Discover minimalist elegance',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    createdBy: { id: 'user3', name: 'Emma Wilson' },
    isActive: false,
    tokensUsed: 0,
    generationMethod: 'TEMPLATE' as const,
    changesSummary: 'Applied minimalist template with modern twist',
    parentVersionId: 'v3',
    changeType: 'TEMPLATE_APPLY' as const
  }
];

export default function AIGenerationDemoPage() {
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['v2', 'v3']);
  const [currentJob, setCurrentJob] = useState(mockJob);

  const handleRegenerateStep = (step: string) => {
    console.log('Regenerating step:', step);
    // In a real app, this would trigger the regeneration API
  };

  const handleVersionRegeneration = (versionId: string, options: any) => {
    console.log('Regenerating version:', versionId, options);
    // In a real app, this would trigger version regeneration
  };

  const handleRestoreVersion = (versionId: string) => {
    console.log('Restoring version:', versionId);
    // In a real app, this would restore the version
  };

  const simulateJobProgress = () => {
    // Simulate job completion
    setCurrentJob({
      ...currentJob,
      status: 'COMPLETED',
      tokensConsumed: 2000,
      completedAt: new Date().toISOString(),
      steps: currentJob.steps.map(step => ({
        ...step,
        status: 'COMPLETED' as const,
        tokensUsed: step.estimatedTokens || step.tokensUsed,
        executedAt: new Date().toISOString()
      }))
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          AI Generation Interface Demo
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Experience the premium AI content generation workflow with visual timeline tracking, 
          transparent token usage, and advanced version comparison capabilities.
        </p>
        <div className="flex justify-center space-x-4">
          <Badge className="bg-primary-100 text-primary-700 border-primary-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium UI/UX
          </Badge>
          <Badge className="bg-success-100 text-success-700 border-success-200">
            <Zap className="h-3 w-3 mr-1" />
            Real-time Progress
          </Badge>
          <Badge className="bg-warning-100 text-warning-700 border-warning-200">
            <ArrowLeftRight className="h-3 w-3 mr-1" />
            Version Comparison
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflow" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Generation Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center space-x-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span>Version Comparison</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          {/* Demo Controls */}
          <Card className="border-dashed border-2 border-primary-200 bg-primary-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Demo Controls
              </CardTitle>
              <CardDescription>
                Interact with the demo to see the AI generation workflow in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={simulateJobProgress}>
                  <Play className="h-4 w-4 mr-2" /> <span>Complete Generation</span></Button>
                <Button variant="outline" onClick={() => <span>setCurrentJob(mockJob)}></span><RotateCcw className="h-4 w-4 mr-2" /> <span>Reset Demo</span></Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Generation Workflow Component */}
          <AIGenerationWorkflow
            job={currentJob}
            onRegenerateStep={handleRegenerateStep}
            onPauseGeneration={() => console.log('Pausing generation')}
            onResumeGeneration={() => console.log('Resuming generation')}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Version Selection */}
          <Card className="border-dashed border-2 border-primary-200 bg-primary-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ArrowLeftRight className="h-5 w-5 mr-2" />
                Version Selection
              </CardTitle>
              <CardDescription>
                Select versions to compare (currently comparing versions {selectedVersions.join(', ')})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedVersions.includes(version.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                    onClick={() => {
                      if (selectedVersions.includes(version.id)) {
                        setSelectedVersions(selectedVersions.filter(id => id !== version.id));
                      } else if (selectedVersions.length < 4) {
                        setSelectedVersions([...selectedVersions, version.id]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">v{version.versionNumber}</span>
                      <div className="flex items-center space-x-1">
                        {version.generationMethod === 'AI' && <Zap className="h-3 w-3 text-primary-600" />}
                        {version.generationMethod === 'MANUAL' && <User className="h-3 w-3 text-success-600" />}
                        {version.generationMethod === 'TEMPLATE' && <Copy className="h-3 w-3 text-warning-600" />}
                      </div>
                    </div>
                    <div className="aspect-square bg-neutral-100 rounded overflow-hidden mb-2">
                      <img
                        src={version.finalImageUrl}
                        alt={`Version ${version.versionNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-2">
                      {version.publicationText}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Version Comparator Component */}
          <ContentVersionComparator
            versions={mockVersions}
            selectedVersionIds={selectedVersions}
            onVersionSelect={setSelectedVersions}
            onRegenerateStep={handleVersionRegeneration}
            onRestoreVersion={handleRestoreVersion}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}