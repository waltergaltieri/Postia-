'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeftRight,
  RotateCcw,
  Eye,
  Download,
  Copy,
  Star,
  Clock,
  User,
  Zap,
  FileText,
  Image,
  Hash,
  MessageSquare,
  TrendingUp,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentVersion {
  id: string;
  versionNumber: number;
  finalImageUrl?: string;
  embeddedText?: string;
  publicationText?: string;
  hashtags: string[];
  cta?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  changesSummary?: string;
  tokensUsed?: number;
  generationMethod: 'AI' | 'MANUAL' | 'TEMPLATE';
  generationSteps?: {
    step: string;
    status: 'COMPLETED' | 'FAILED';
    tokensUsed: number;
    output?: any;
  }[];
  parentVersionId?: string;
  changeType?: 'REGENERATION' | 'MANUAL_EDIT' | 'TEMPLATE_APPLY' | 'STEP_REGENERATION';
}

interface RegenerationOptions {
  step: 'IDEA' | 'COPY_DESIGN' | 'COPY_PUBLICATION' | 'BASE_IMAGE' | 'FINAL_DESIGN' | 'ALL';
  prompt?: string;
  preserveElements: string[];
  brandTone?: string;
  targetAudience?: string;
  baseVersionId?: string;
}

interface ContentVersionComparatorProps {
  versions: ContentVersion[];
  selectedVersionIds?: string[];
  onVersionSelect?: (versionIds: string[]) => void;
  onRegenerateStep?: (versionId: string, options: RegenerationOptions) => void;
  onRestoreVersion?: (versionId: string) => void;
  className?: string;
}

export default function ContentVersionComparator({
  versions,
  selectedVersionIds = [],
  onVersionSelect,
  onRegenerateStep,
  onRestoreVersion,
  className = ""
}: ContentVersionComparatorProps) {
  const [compareVersions, setCompareVersions] = useState<ContentVersion[]>([]);
  const [currentCompareIndex, setCurrentCompareIndex] = useState(0);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [selectedVersionForRegeneration, setSelectedVersionForRegeneration] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  const [regenerationForm, setRegenerationForm] = useState<RegenerationOptions>({
    step: 'ALL',
    prompt: '',
    preserveElements: [],
    brandTone: '',
    targetAudience: '',
  });

  useEffect(() => {
    if (selectedVersionIds.length >= 2) {
      const versionsToCompare = selectedVersionIds
        .map(id => versions.find(v => v.id === id))
        .filter(Boolean) as ContentVersion[];
      setCompareVersions(versionsToCompare.slice(0, 4)); // Max 4 versions for comparison
    }
  }, [selectedVersionIds, versions]);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'AI':
        return <Zap className="h-4 w-4 text-primary-600" />;
      case 'MANUAL':
        return <User className="h-4 w-4 text-success-600" />;
      case 'TEMPLATE':
        return <Copy className="h-4 w-4 text-warning-600" />;
      default:
        return <GitBranch className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'AI':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'MANUAL':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'TEMPLATE':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getChangeTypeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'REGENERATION':
        return <RefreshCw className="h-3 w-3" />;
      case 'MANUAL_EDIT':
        return <User className="h-3 w-3" />;
      case 'TEMPLATE_APPLY':
        return <Copy className="h-3 w-3" />;
      case 'STEP_REGENERATION':
        return <RotateCcw className="h-3 w-3" />;
      default:
        return <GitBranch className="h-3 w-3" />;
    }
  };

  const calculateDifferences = (version1: ContentVersion, version2: ContentVersion) => {
    const differences = [];
    
    if (version1.publicationText !== version2.publicationText) {
      differences.push('Publication Text');
    }
    if (JSON.stringify(version1.hashtags) !== JSON.stringify(version2.hashtags)) {
      differences.push('Hashtags');
    }
    if (version1.cta !== version2.cta) {
      differences.push('Call to Action');
    }
    if (version1.finalImageUrl !== version2.finalImageUrl) {
      differences.push('Image');
    }
    
    return differences;
  };

  const handleRegenerateStep = (versionId: string, step: string) => {
    setSelectedVersionForRegeneration(versionId);
    setRegenerationForm({
      ...regenerationForm,
      step: step as RegenerationOptions['step'],
      baseVersionId: versionId
    });
    setShowRegenerateDialog(true);
  };

  const handleSubmitRegeneration = () => {
    if (selectedVersionForRegeneration && onRegenerateStep) {
      onRegenerateStep(selectedVersionForRegeneration, regenerationForm);
      setShowRegenerateDialog(false);
      setSelectedVersionForRegeneration(null);
    }
  };

  const buildVersionTree = () => {
    const tree: { [key: string]: ContentVersion[] } = {};
    
    versions.forEach(version => {
      const parentId = version.parentVersionId || 'root';
      if (!tree[parentId]) {
        tree[parentId] = [];
      }
      tree[parentId].push(version);
    });
    
    return tree;
  };

  const renderVersionCard = (version: ContentVersion, index: number) => (
    <motion.div
      key={version.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="space-y-4"
    >
      {/* Version Header */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg">Version {version.versionNumber}</h3>
            {version.isActive && (
              <Badge className="bg-success-100 text-success-700 border-success-200">
                <Star className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <Badge className={getMethodColor(version.generationMethod)}>
            {getMethodIcon(version.generationMethod)}
            <span className="ml-1">{version.generationMethod}</span>
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          {!version.isActive && onRestoreVersion && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onRestoreVersion(version.id)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restore
            </Button>
          )}
        </div>
      </div>

      {/* Content Comparison */}
      <div className="space-y-4">
        {/* Image */}
        {version.finalImageUrl && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Image className="h-4 w-4 mr-1" />
              Generated Image
            </Label>
            <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden border">
              <img
                src={version.finalImageUrl}
                alt={`Version ${version.versionNumber}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
          </div>
        )}

        {/* Publication Text */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Publication Text
          </Label>
          <div className="p-3 bg-white border rounded-lg min-h-[100px]">
            <p className="text-sm whitespace-pre-wrap">
              {version.publicationText || 'No publication text'}
            </p>
          </div>
        </div>

        {/* Hashtags */}
        {version.hashtags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              Hashtags ({version.hashtags.length})
            </Label>
            <div className="flex flex-wrap gap-1">
              {version.hashtags.map((tag, tagIndex) => (
                <Badge key={tagIndex} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {version.cta && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              Call to Action
            </Label>
            <div className="p-2 bg-primary-50 border border-primary-200 rounded text-sm">
              {version.cta}
            </div>
          </div>
        )}

        {/* Generation Steps */}
        {version.generationSteps && version.generationSteps.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Generation Steps
            </Label>
            <div className="space-y-2">
              {version.generationSteps.map((step, stepIndex) => (
                <div key={stepIndex} className="flex items-center justify-between p-2 bg-neutral-50 rounded border">
                  <div className="flex items-center space-x-2">
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4 text-success-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error-600" />
                    )}
                    <span className="text-sm font-medium">{step.step}</span>
                    <Badge variant="outline" className="text-xs">
                      <Coins className="h-3 w-3 mr-1" />
                      {step.tokensUsed}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRegenerateStep(version.id, step.step)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 rounded border text-sm">
          <div>
            <Label className="text-xs text-neutral-600">Created</Label>
            <p className="font-medium">{new Date(version.createdAt).toLocaleString()}</p>
          </div>
          {version.createdBy && (
            <div>
              <Label className="text-xs text-neutral-600">Created By</Label>
              <p className="font-medium">{version.createdBy.name}</p>
            </div>
          )}
          {version.tokensUsed && (
            <div>
              <Label className="text-xs text-neutral-600">Tokens Used</Label>
              <p className="font-medium">{version.tokensUsed.toLocaleString()}</p>
            </div>
          )}
          {version.changesSummary && (
            <div>
              <Label className="text-xs text-neutral-600">Changes</Label>
              <p className="font-medium text-xs">{version.changesSummary}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (compareVersions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
            <ArrowLeftRight className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Select Versions to Compare</h3>
          <p className="text-sm text-neutral-600 text-center max-w-sm">
            Choose 2-4 versions from the version history to see a detailed side-by-side comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-primary-50 to-primary-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-neutral-900 flex items-center">
                <ArrowLeftRight className="h-5 w-5 mr-2" />
                Version Comparison
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Side-by-side analysis of {compareVersions.length} selected versions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeHistory(!showChangeHistory)}
              >
                <GitBranch className="h-3 w-3 mr-1" />
                {showChangeHistory ? 'Hide' : 'Show'} History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 mr-1" />
                ) : (
                  <Maximize2 className="h-3 w-3 mr-1" />
                )}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Change History Timeline */}
      <AnimatePresence>
        {showChangeHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change History Timeline</CardTitle>
                <CardDescription>
                  Visual representation of how these versions evolved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />
                  <div className="space-y-4">
                    {compareVersions
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((version, index) => (
                        <div key={version.id} className="relative flex items-center space-x-4">
                          <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-primary-200 rounded-full">
                            {getChangeTypeIcon(version.changeType)}
                          </div>
                          <div className="flex-1 p-3 bg-neutral-50 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">Version {version.versionNumber}</h4>
                                <p className="text-sm text-neutral-600">
                                  {new Date(version.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Badge className={getMethodColor(version.generationMethod)}>
                                {version.generationMethod}
                              </Badge>
                            </div>
                            {version.changesSummary && (
                              <p className="text-sm text-neutral-700 mt-2">
                                {version.changesSummary}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Grid */}
      <div className={`grid gap-6 ${
        compareVersions.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
        compareVersions.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
      }`}>
        {compareVersions.map((version, index) => (
          <Card key={version.id} className="border-2 border-primary-200">
            <CardContent className="p-6">
              {renderVersionCard(version, index)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Differences Summary */}
      {compareVersions.length === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowLeftRight className="h-5 w-5 mr-2" />
              Key Differences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculateDifferences(compareVersions[0], compareVersions[1]).map((diff, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-warning-50 border border-warning-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                  <span className="text-sm font-medium">{diff} differs between versions</span>
                </div>
              ))}
              {calculateDifferences(compareVersions[0], compareVersions[1]).length === 0 && (
                <div className="flex items-center space-x-2 p-2 bg-success-50 border border-success-200 rounded">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium">No significant differences detected</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regeneration Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regenerate Content Step</DialogTitle>
            <DialogDescription>
              Configure how you want to regenerate this specific step
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Regeneration Scope</Label>
              <select
                value={regenerationForm.step}
                onChange={(e) => setRegenerationForm({ 
                  ...regenerationForm, 
                  step: e.target.value as RegenerationOptions['step']
                })}
                className="w-full border border-neutral-300 rounded-md px-3 py-2"
              >
                <option value="ALL">Complete Content</option>
                <option value="IDEA">Content Idea Only</option>
                <option value="COPY_DESIGN">Copy for Design</option>
                <option value="COPY_PUBLICATION">Publication Copy</option>
                <option value="BASE_IMAGE">Base Image</option>
                <option value="FINAL_DESIGN">Final Design</option>
              </select>
            </div>

            <div>
              <Label>Additional Instructions</Label>
              <Textarea
                value={regenerationForm.prompt}
                onChange={(e) => setRegenerationForm({ ...regenerationForm, prompt: e.target.value })}
                placeholder="Provide specific instructions for regeneration..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand Tone</Label>
                <Input
                  value={regenerationForm.brandTone}
                  onChange={(e) => setRegenerationForm({ ...regenerationForm, brandTone: e.target.value })}
                  placeholder="Professional, casual, fun..."
                />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={regenerationForm.targetAudience}
                  onChange={(e) => setRegenerationForm({ ...regenerationForm, targetAudience: e.target.value })}
                  placeholder="Young professionals, parents..."
                />
              </div>
            </div>

            <div>
              <Label>Preserve Elements</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Hashtags', 'Call to Action', 'Brand Colors', 'Image Style'].map((element) => (
                  <label key={element} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={regenerationForm.preserveElements.includes(element)}
                      onChange={(e) => {
                        const elements = e.target.checked
                          ? [...regenerationForm.preserveElements, element]
                          : regenerationForm.preserveElements.filter(el => el !== element);
                        setRegenerationForm({ ...regenerationForm, preserveElements: elements });
                      }}
                    />
                    <span className="text-sm">{element}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRegeneration}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Start Regeneration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}