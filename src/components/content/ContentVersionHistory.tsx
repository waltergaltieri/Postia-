'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RotateCcw, 
  Eye, 
  Download, 
  Compare,
  Clock,
  User,
  GitBranch,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  Copy,
  Trash2,
  Star,
  History
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
}

interface Post {
  id: string;
  campaignName: string;
  clientName: string;
  status: string;
  currentVersion: ContentVersion;
  versions: ContentVersion[];
}

interface RegenerationOptions {
  step: 'IDEA' | 'COPY_DESIGN' | 'COPY_PUBLICATION' | 'BASE_IMAGE' | 'FINAL_DESIGN' | 'ALL';
  prompt?: string;
  preserveElements: string[];
  brandTone?: string;
  targetAudience?: string;
}

export default function ContentVersionHistory({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  // Regeneration form state
  const [regenerationForm, setRegenerationForm] = useState<RegenerationOptions>({
    step: 'ALL',
    prompt: '',
    preserveElements: [],
    brandTone: '',
    targetAudience: '',
  });

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/versions`);
      const result = await response.json();
      
      if (result.success) {
        setPost(result.data.post);
      }
    } catch (error) {
      console.error('Error fetching post versions:', error);
      toast.error('Failed to load post versions');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateContent = async () => {
    setRegenerating(true);
    
    try {
      const response = await fetch(`/api/posts/${postId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regenerationForm),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Content regeneration started');
        setShowRegenerateDialog(false);
        
        // Poll for completion
        const jobId = result.data.jobId;
        pollRegenerationStatus(jobId);
      } else {
        toast.error(result.error?.message || 'Failed to start regeneration');
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      toast.error('Failed to regenerate content');
    } finally {
      setRegenerating(false);
    }
  };

  const pollRegenerationStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/content/jobs/${jobId}`);
        const result = await response.json();

        if (result.success) {
          const job = result.data.job;
          
          if (job.status === 'COMPLETED') {
            clearInterval(interval);
            toast.success('Content regenerated successfully');
            fetchPost();
          } else if (job.status === 'FAILED') {
            clearInterval(interval);
            toast.error('Content regeneration failed');
          }
        }
      } catch (error) {
        console.error('Error polling regeneration status:', error);
        clearInterval(interval);
      }
    }, 2000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version based on the selected one.')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/versions/${versionId}/restore`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Version restored successfully');
        fetchPost();
      } else {
        toast.error(result.error?.message || 'Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/versions/${versionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Version deleted successfully');
        fetchPost();
      } else {
        toast.error(result.error?.message || 'Failed to delete version');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version');
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length !== 2) {
      toast.error('Please select exactly 2 versions to compare');
      return;
    }
    setShowCompareDialog(true);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'AI':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'MANUAL':
        return <User className="h-4 w-4 text-green-500" />;
      case 'TEMPLATE':
        return <Copy className="h-4 w-4 text-purple-500" />;
      default:
        return <GitBranch className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'AI':
        return 'bg-blue-100 text-blue-800';
      case 'MANUAL':
        return 'bg-green-100 text-green-800';
      case 'TEMPLATE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version History</h1>
          <p className="text-muted-foreground">
            {post.campaignName} • {post.clientName}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
            <DialogTrigger asChild>
              <Button>
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Regenerate Content</DialogTitle>
                <DialogDescription>
                  Configure how you want to regenerate this content
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                  <Label>Additional Prompt (Optional)</Label>
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
                  <Button onClick={handleRegenerateContent} disabled={regenerating}>
                    {regenerating ? 'Regenerating...' : 'Start Regeneration'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedVersions.length === 2 && (
            <Button variant="outline" onClick={handleCompareVersions}>
              <Compare className="h-4 w-4 mr-2" />
              Compare Selected
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="versions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="versions">All Versions ({post.versions.length})</TabsTrigger>
          <TabsTrigger value="current">Current Version</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Version (v{post.currentVersion.versionNumber})
                <div className="flex items-center space-x-2">
                  <Badge className={getMethodColor(post.currentVersion.generationMethod)}>
                    {getMethodIcon(post.currentVersion.generationMethod)}
                    <span className="ml-1">{post.currentVersion.generationMethod}</span>
                  </Badge>
                  <Badge variant="default">
                    <Star className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Preview */}
              {post.currentVersion.finalImageUrl && (
                <div className="aspect-square bg-muted rounded-lg overflow-hidden max-w-md">
                  <img
                    src={post.currentVersion.finalImageUrl}
                    alt="Current version"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <Label>Publication Text</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {post.currentVersion.publicationText || 'No publication text'}
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {post.currentVersion.hashtags.length > 0 && (
                <div>
                  <Label>Hashtags</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {post.currentVersion.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              {post.currentVersion.cta && (
                <div>
                  <Label>Call to Action</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {post.currentVersion.cta}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {new Date(post.currentVersion.createdAt).toLocaleString()}
                  </p>
                </div>
                {post.currentVersion.createdBy && (
                  <div>
                    <Label>Created By</Label>
                    <p className="text-sm">{post.currentVersion.createdBy.name}</p>
                  </div>
                )}
                {post.currentVersion.tokensUsed && (
                  <div>
                    <Label>Tokens Used</Label>
                    <p className="text-sm">{post.currentVersion.tokensUsed}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                All versions of this content, including drafts and revisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {post.versions.map((version) => (
                  <div key={version.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVersions([...selectedVersions, version.id]);
                            } else {
                              setSelectedVersions(selectedVersions.filter(id => id !== version.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Version {version.versionNumber}</h4>
                            <Badge className={getMethodColor(version.generationMethod)}>
                              {getMethodIcon(version.generationMethod)}
                              <span className="ml-1">{version.generationMethod}</span>
                            </Badge>
                            {version.isActive && (
                              <Badge variant="default">
                                <Star className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                            {version.createdBy && ` • by ${version.createdBy.name}`}
                          </p>
                          {version.changesSummary && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {version.changesSummary}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        {!version.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreVersion(version.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        {!version.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVersion(version.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {version.finalImageUrl && (
                        <div className="aspect-square bg-muted rounded overflow-hidden">
                          <img
                            src={version.finalImageUrl}
                            alt={`Version ${version.versionNumber}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Publication Text</Label>
                            <p className="text-sm line-clamp-3">
                              {version.publicationText || 'No publication text'}
                            </p>
                          </div>
                          
                          {version.hashtags.length > 0 && (
                            <div>
                              <Label className="text-xs">Hashtags</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {version.hashtags.slice(0, 5).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {version.hashtags.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{version.hashtags.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {version.tokensUsed && (
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Tokens: {version.tokensUsed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {post.versions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No versions available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected versions
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            {selectedVersions.slice(0, 2).map((versionId, index) => {
              const version = post.versions.find(v => v.id === versionId);
              if (!version) return null;

              return (
                <div key={versionId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Version {version.versionNumber}</h3>
                    <Badge className={getMethodColor(version.generationMethod)}>
                      {version.generationMethod}
                    </Badge>
                  </div>
                  
                  {version.finalImageUrl && (
                    <div className="aspect-square bg-muted rounded overflow-hidden">
                      <img
                        src={version.finalImageUrl}
                        alt={`Version ${version.versionNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-xs">Publication Text</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {version.publicationText || 'No publication text'}
                    </div>
                  </div>
                  
                  {version.hashtags.length > 0 && (
                    <div>
                      <Label className="text-xs">Hashtags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {version.hashtags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCompareDialog(false)}>
              Close Comparison
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}