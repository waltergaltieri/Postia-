'use client';

import { useState, useEffect } from 'react';
import { PostStatus, SocialPlatform } from '@/generated/prisma';

interface Post {
  id: string;
  content: string;
  scheduledFor: string;
  status: PostStatus;
  platforms: SocialPlatform[];
  imageUrl: string | null;
}

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  posts: Post[];
  postCount: number;
  statusCounts: {
    draft: number;
    approved: number;
    published: number;
  };
}

interface CalendarData {
  campaign: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    client: {
      id: string;
      brandName: string;
    };
  };
  calendar: CalendarDay[];
  summary: {
    totalPosts: number;
    statusCounts: {
      draft: number;
      approved: number;
      published: number;
    };
    platformCounts: Record<string, number>;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

interface CalendarViewProps {
  campaignId: string;
  onPostClick?: (post: Post) => void;
  onDateClick?: (date: string) => void;
}

export default function CalendarView({ campaignId, onPostClick, onDateClick }: CalendarViewProps) {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, [campaignId, currentMonth]);

  const fetchCalendarData = async () => {
    try {
      const monthStr = currentMonth.toISOString().slice(0, 7); // YYYY-MM
      const response = await fetch(`/api/campaigns/${campaignId}/calendar?month=${monthStr}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch calendar data');
      }

      setCalendarData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800';
      case PostStatus.APPROVED:
        return 'bg-blue-100 text-blue-800';
      case PostStatus.PUBLISHED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return '📘';
      case SocialPlatform.INSTAGRAM:
        return '📷';
      case SocialPlatform.LINKEDIN:
        return '💼';
      default:
        return '📱';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).getDate();
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isCurrentMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="text-center py-8 text-gray-500">
        No calendar data available
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Create calendar grid
  const calendarGrid = [];
  const calendarDays = calendarData.calendar.reduce((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {} as Record<string, CalendarDay>);

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarGrid.push(calendarDays[dateString] || { date: dateString, posts: [], postCount: 0 });
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {calendarData.campaign.name} - Calendar
            </h2>
            <p className="text-sm text-gray-600">
              {calendarData.campaign.client.brandName}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
              {monthName}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{calendarData.summary.totalPosts}</div>
            <div className="text-sm text-gray-500">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{calendarData.summary.statusCounts.draft}</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{calendarData.summary.statusCounts.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{calendarData.summary.statusCounts.published}</div>
            <div className="text-sm text-gray-500">Published</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 rounded-md ${
                day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
              } ${day && isToday(day.date) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => day && onDateClick?.(day.date)}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-2 ${
                    isToday(day.date) ? 'text-blue-600' : 
                    isCurrentMonth(day.date) ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {formatDate(day.date)}
                  </div>
                  
                  {day.posts.length > 0 && (
                    <div className="space-y-1">
                      {day.posts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPostClick?.(post);
                          }}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(post.status)}`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {post.platforms.map((platform) => (
                              <span key={platform} className="text-xs">
                                {getPlatformIcon(platform)}
                              </span>
                            ))}
                          </div>
                          <div className="truncate">
                            {post.content.substring(0, 30)}...
                          </div>
                        </div>
                      ))}
                      
                      {day.posts.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.posts.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                  
                  {day.postCount === 0 && (
                    <div className="text-xs text-gray-400 text-center mt-8">
                      No posts
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Platform Summary */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Platform Distribution</h4>
        <div className="flex flex-wrap gap-4">
          {Object.entries(calendarData.summary.platformCounts).map(([platform, count]) => (
            <div key={platform} className="flex items-center space-x-2">
              <span className="text-lg">{getPlatformIcon(platform as SocialPlatform)}</span>
              <span className="text-sm text-gray-600">{platform}: {count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}