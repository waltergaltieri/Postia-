'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Upload, 
  Image, 
  Palette, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  brandName: string;
  brandColors: string[];
  description: string;
  logoUrl: string;
  whatsappNumber: string;
  createdAt: string;
  campaignCount: number;
  lastActivity: string;
}

interface BrandAsset {
  id: string;
  type: 'LOGO' | 'IMAGE' | 'TEMPLATE' | 'PALETTE';
  name: string;
  url: string;
  metadata: any;
  createdAt: string;
}

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  username: string;
}

export default function ClientManagementInterface() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showAssetUploadDialog, setShowAssetUploadDialog] = useState(false);

  // New client form state
  const [newClient, setNewClient] = useState({
    brandName: '',
    description: '',
    brandColors: [''],
    whatsappNumber: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const result = await response.json();
      
      if (result.success) {
        setClients(result.data.clients);
        if (result.data.clients.length > 0 && !selectedClient) {
          setSelectedClient(result.data.clients[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      const [assetsResponse, socialResponse] = await Promise.all([
        fetch(`/api/clients/${clientId}/assets`),
        fetch(`/api/clients/${clientId}/social-links`)
      ]);

      const [assetsResult, socialResult] = await Promise.all([
        assetsResponse.json(),
        socialResponse.json()
      ]);

      if (assetsResult.success) {
        setBrandAssets(assetsResult.data.assets);
      }

      if (socialResult.success) {
        setSocialLinks(socialResult.data.links);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    }
  };

  const handleCreateClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Client created successfully');
        setShowNewClientDialog(false);
        setNewClient({
          brandName: '',
          description: '',
          brandColors: [''],
          whatsappNumber: '',
        });
        fetchClients();
      } else {
        toast.error(result.error?.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!selectedClient) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('name', file.name);

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/assets`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Asset uploaded successfully');
        fetchClientDetails(selectedClient.id);
        setShowAssetUploadDialog(false);
      } else {
        toast.error(result.error?.message || 'Failed to upload asset');
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
    }
  };

  const filteredClients = clients.filter(client =>
    client.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'LOGO':
        return <Building2 className="h-4 w-4" />;
      case 'IMAGE':
        return <Image className="h-4 w-4" />;
      case 'TEMPLATE':
        return <FileText className="h-4 w-4" />;
      case 'PALETTE':
        return <Palette className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">
            Manage your clients and their brand assets
          </p>
        </div>
        <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client profile with brand information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={newClient.brandName}
                  onChange={(e) => setNewClient({ ...newClient, brandName: e.target.value })}
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newClient.description}
                  onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                  placeholder="Brief description of the brand"
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={newClient.whatsappNumber}
                  onChange={(e) => setNewClient({ ...newClient, whatsappNumber: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClient}>
                  Create Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              Select a client to manage their brand assets
            </CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{client.brandName}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.campaignCount} campaigns
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
              
              {filteredClients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No clients found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assets">Brand Assets</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedClient.brandName}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Client overview and brand information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedClient.description || 'No description provided'}
                      </p>
                    </div>
                    
                    <div>
                      <Label>Brand Colors</Label>
                      <div className="flex space-x-2 mt-2">
                        {selectedClient.brandColors.map((color, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {selectedClient.whatsappNumber && (
                      <div>
                        <Label>WhatsApp</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedClient.whatsappNumber}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label>Campaigns</Label>
                        <p className="text-2xl font-bold">{selectedClient.campaignCount}</p>
                      </div>
                      <div>
                        <Label>Assets</Label>
                        <p className="text-2xl font-bold">{brandAssets.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Brand Assets
                      <Dialog open={showAssetUploadDialog} onOpenChange={setShowAssetUploadDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Asset
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Brand Asset</DialogTitle>
                            <DialogDescription>
                              Add a new asset to the brand library
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Asset Type</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {['LOGO', 'IMAGE', 'TEMPLATE', 'PALETTE'].map((type) => (
                                  <Button
                                    key={type}
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = type === 'PALETTE' ? '.json,.txt' : 'image/*';
                                      input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                          handleFileUpload(file, type);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    {getAssetIcon(type)}
                                    <span className="ml-2">{type}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                    <CardDescription>
                      Manage logos, images, templates, and color palettes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {brandAssets.map((asset) => (
                        <Card key={asset.id} className="overflow-hidden">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {asset.type === 'IMAGE' || asset.type === 'LOGO' ? (
                              <img
                                src={asset.url}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center">
                                {getAssetIcon(asset.type)}
                                <p className="text-sm mt-2">{asset.type}</p>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(asset.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {brandAssets.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No brand assets uploaded</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setShowAssetUploadDialog(true)}
                          >
                            Upload First Asset
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>
                      Manage social media profiles and links
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {socialLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="capitalize">
                              {link.platform}
                            </Badge>
                            <div>
                              <p className="font-medium">@{link.username}</p>
                              <p className="text-sm text-muted-foreground">{link.url}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {socialLinks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No social media links added</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Social Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Settings</CardTitle>
                    <CardDescription>
                      Manage client preferences and configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>API Access</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Generate API keys for external integrations
                        </p>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Generate API Key
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Data Export</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Export client data and assets
                        </p>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export Data
                        </Button>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Label className="text-red-600">Danger Zone</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Permanently delete this client and all associated data
                        </p>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Client
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a client to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}