'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar,
  Clock,
  Image,
  FileText,
  Layers,
  Video,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  Share,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignPublication {
  id: string;
  contentType: 'text_only' | 'single_image' | 'carousel' | 'video';
  platform: string;
  scheduledDate: Date;
  content: {
    text: string;
    hashtags: string[];
    images?: string[];
    designAssets?: string[];
  };
  status: 'draft' | 'approved' | 'scheduled' | 'published';
  client: {
    id: string;
    name: string;
  };
  metadata?: any;
}

interface CalendarData {
  [date: string]: CampaignPublication[];
}

interface CampaignSummary {
  total: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byContentType: Record<string, number>;
}

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
};

const contentTypeIcons = {
  text_only: FileText,
  single_image: Image,
  carousel: Layers,
  video: Video,
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
};

export default function CampaignContentCalendar({ campaignId }: { campaignId: string }) {
  const [publications, setPublications] = useState<CampaignPublication[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedPublication, setSelectedPublication] = useState<CampaignPublication | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    platform: '',
    contentType: '',
    status: ''
  });

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchCampaignContent();
  }, [campaignId, filters]);

  const fetchCampaignContent = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.contentType) params.append('contentType', filters.contentType);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/campaigns/${campaignId}/generate-content?${params}`);
      const data = await response.json();

      if (data.success) {
        setPublications(data.data.publications);
        setCalendarData(data.data.calendar);
        setSummary(data.data.summary);
      } else {
        toast.error('Error loading campaign content');
      }
    } catch (error) {
      console.error('Error fetching campaign content:', error);
      toast.error('Error loading campaign content');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === month;
      const dayPublications = calendarData[dateKey] || [];
      
      days.push({
        date: new Date(currentDate),
        dateKey,
        isCurrentMonth,
        publications: dayPublications
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getPlatformIcon = (platform: string) => {
    const Icon = platformIcons[platform as keyof typeof platformIcons] || FileText;
    return <Icon className="h-3 w-3" />;
  };

  const getContentTypeIcon = (contentType: string) => {
    const Icon = contentTypeIcons[contentType as keyof typeof contentTypeIcons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Loading campaign content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Posts</p>
                <p className="text-2xl font-bold">{summary?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Published</p>
                <p className="text-2xl font-bold">{summary?.byStatus.published || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Scheduled</p>
                <p className="text-2xl font-bold">{summary?.byStatus.scheduled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Drafts</p>
                <p className="text-2xl font-bold">{summary?.byStatus.draft || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Campaign Content Calendar</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={(value: 'calendar' | 'list') => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Label>Filters:</Label>
            </div>
            
            <Select value={filters.platform} onValueChange={(value) => setFilters({...filters, platform: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.contentType} onValueChange={(value) => setFilters({...filters, contentType: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="text_only">Text Only</SelectItem>
                <SelectItem value="single_image">Single Image</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setFilters({ platform: '', contentType: '', status: '' })}>
              Clear Filters
            </Button>
          </div>

          <Tabs value={viewMode} onValueChange={(value: string) => setViewMode(value as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigateMonth('prev')}>
                  ← Previous
                </Button>
                <h3 className="text-lg font-semibold">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <Button variant="outline" onClick={() => navigateMonth('next')}>
                  Next →
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {generateCalendarDays().map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-24 p-1 border border-gray-200 ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${day.publications.length > 0 ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => {
                      if (day.publications.length > 0) {
                        setSelectedDate(day.dateKey);
                      }
                    }}
                  >
                    <div className={`text-sm ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day.date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {day.publications.slice(0, 3).map((pub, pubIndex) => (
                        <div
                          key={pubIndex}
                          className={`text-xs p-1 rounded flex items-center space-x-1 ${statusColors[pub.status]}`}
                        >
                          {getPlatformIcon(pub.platform)}
                          <span className="truncate">{pub.content.text.substring(0, 20)}...</span>
                        </div>
                      ))}
                      
                      {day.publications.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.publications.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-2">
                {publications.map((publication) => (
                  <Card key={publication.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getContentTypeIcon(publication.contentType)}
                            {getPlatformIcon(publication.platform)}
                            <Badge className={statusColors[publication.status]}>
                              {publication.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {publication.scheduledDate ? formatDate(new Date(publication.scheduledDate)) : 'No date'}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-2">{publication.content.text}</p>
                          
                          {publication.content.hashtags && publication.content.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {publication.content.hashtags.slice(0, 5).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {publication.content.images && publication.content.images.length > 0 && (
                            <div className="flex space-x-2">
                              {publication.content.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Content ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPublication(publication)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Publication Detail Dialog */}
      <Dialog open={!!selectedPublication} onOpenChange={() => setSelectedPublication(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publication Details</DialogTitle>
            <DialogDescription>
              {selectedPublication && formatDate(new Date(selectedPublication.scheduledDate))}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPublication && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getContentTypeIcon(selectedPublication.contentType)}
                {getPlatformIcon(selectedPublication.platform)}
                <Badge className={statusColors[selectedPublication.status]}>
                  {selectedPublication.status}
                </Badge>
              </div>

              <div>
                <Label>Content</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded">{selectedPublication.content.text}</p>
              </div>

              {selectedPublication.content.hashtags && (
                <div>
                  <Label>Hashtags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPublication.content.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPublication.content.images && selectedPublication.content.images.length > 0 && (
                <div>
                  <Label>Images</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {selectedPublication.content.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Content ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button>
                  <Share className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}