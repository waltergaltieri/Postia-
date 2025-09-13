import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgencyOverview from '@/components/dashboard/AgencyOverview';
import { renderWithProviders, mockFetch, createMockApiResponse } from '../../../tests/utils/test-helpers';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('AgencyOverview Component', () => {
  const mockDashboardData = {
    agency: {
      name: 'Test Agency',
      subscriptionPlan: 'INTERMEDIATE',
      tokenBalance: 5000,
      userCount: 3,
      clientCount: 5,
    },
    campaigns: {
      active: 8,
      completed: 12,
      totalPosts: 150,
      publishedPosts: 120,
    },
    contentGeneration: {
      jobsThisMonth: 25,
      tokensConsumedThisMonth: 2500,
      successRate: 92,
      averageCompletionTime: 180,
    },
    recentActivity: [
      {
        id: '1',
        type: 'content_generated',
        description: 'Generated content for Summer Campaign',
        timestamp: '2024-01-15T10:30:00Z',
        user: 'John Doe',
      },
      {
        id: '2',
        type: 'campaign_created',
        description: 'Created new campaign: Winter Collection',
        timestamp: '2024-01-15T09:15:00Z',
        user: 'Jane Smith',
      },
    ],
    upcomingPosts: [
      {
        id: '1',
        campaignName: 'Summer Campaign',
        clientName: 'Fashion Brand',
        scheduledDate: '2024-01-20T14:00:00Z',
        status: 'approved',
      },
      {
        id: '2',
        campaignName: 'Product Launch',
        clientName: 'Tech Startup',
        scheduledDate: '2024-01-21T10:00:00Z',
        status: 'draft',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agency overview with correct data', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    // Check loading state initially
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });

    // Check key metrics
    expect(screen.getByText('8')).toBeInTheDocument(); // Active campaigns
    expect(screen.getByText('5')).toBeInTheDocument(); // Clients
    expect(screen.getByText('25')).toBeInTheDocument(); // Content generated
    expect(screen.getByText('5,000')).toBeInTheDocument(); // Token balance

    // Check subscription plan badge
    expect(screen.getByText('intermediate Plan')).toBeInTheDocument();
  });

  it('displays recent activity correctly', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    // Check activity items
    expect(screen.getByText('Generated content for Summer Campaign')).toBeInTheDocument();
    expect(screen.getByText('Created new campaign: Winter Collection')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays upcoming posts in publishing pipeline', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('Publishing Pipeline')).toBeInTheDocument();
    });

    // Check upcoming posts
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument();
    expect(screen.getByText('Fashion Brand')).toBeInTheDocument();
    expect(screen.getByText('Product Launch')).toBeInTheDocument();
    expect(screen.getByText('Tech Startup')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('shows performance insights correctly', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    });

    // Check performance metrics
    expect(screen.getByText('92%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('3m')).toBeInTheDocument(); // Avg completion time (180s = 3m)
    expect(screen.getByText('80%')).toBeInTheDocument(); // Publication rate (120/150)
  });

  it('displays quick action buttons', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Check quick action buttons
    expect(screen.getByText('New Campaign')).toBeInTheDocument();
    expect(screen.getByText('Add Client')).toBeInTheDocument();
    expect(screen.getByText('Generate Content')).toBeInTheDocument();
    expect(screen.getByText('Invite Team')).toBeInTheDocument();

    // Check links
    const newCampaignLink = screen.getByText('New Campaign').closest('a');
    expect(newCampaignLink).toHaveAttribute('href', '/dashboard/campaigns/new');

    const addClientLink = screen.getByText('Add Client').closest('a');
    expect(addClientLink).toHaveAttribute('href', '/dashboard/clients/new');
  });

  it('handles empty states gracefully', async () => {
    const emptyData = {
      ...mockDashboardData,
      recentActivity: [],
      upcomingPosts: [],
    };

    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(emptyData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText('No upcoming posts scheduled')).toBeInTheDocument();
    });

    // Check empty state actions
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse({ message: 'Server error' }, false, 500),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('allows retrying failed data fetch', async () => {
    const user = userEvent.setup();

    // First call fails, second succeeds
    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse({ message: 'Server error' }, false, 500),
      },
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(mockDashboardData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // Wait for successful data load
    await waitFor(() => {
      expect(screen.getByText('Test Agency')).toBeInTheDocument();
    });
  });

  it('calculates token usage percentage correctly', async () => {
    const highUsageData = {
      ...mockDashboardData,
      agency: {
        ...mockDashboardData.agency,
        tokenBalance: 1000,
      },
      contentGeneration: {
        ...mockDashboardData.contentGeneration,
        tokensConsumedThisMonth: 800,
      },
    };

    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(highUsageData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Token balance
      expect(screen.getByText('800 used this month')).toBeInTheDocument();
    });

    // Check that progress bar reflects usage (20% remaining = 80% used)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '20');
  });

  it('formats large numbers correctly', async () => {
    const largeNumbersData = {
      ...mockDashboardData,
      agency: {
        ...mockDashboardData.agency,
        tokenBalance: 15000,
      },
      contentGeneration: {
        ...mockDashboardData.contentGeneration,
        tokensConsumedThisMonth: 12500,
      },
    };

    mockFetch([
      {
        url: '/api/dashboard/overview',
        response: createMockApiResponse(largeNumbersData),
      },
    ]);

    renderWithProviders(<AgencyOverview />);

    await waitFor(() => {
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('12,500 used this month')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    // Don't mock fetch to keep it in loading state
    renderWithProviders(<AgencyOverview />);

    // Check for loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    const hasLoadingClass = loadingElements.some(el => 
      el.className.includes('animate-pulse')
    );
    expect(hasLoadingClass).toBe(true);
  });
});