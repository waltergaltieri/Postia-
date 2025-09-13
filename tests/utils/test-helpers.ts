/**
 * Test Utilities and Helpers
 * 
 * Common utilities for testing components, API routes, and services
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { SessionProvider } from 'next-auth/react';

// Mock session data for testing
export const mockSession = {
  user: {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    agencyId: 'test-agency-1',
    role: 'OWNER',
  },
  expires: '2024-12-31',
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  { session = mockSession, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API response helpers
export const createMockApiResponse = (data: any, success: boolean = true, status: number = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => ({
    success,
    data: success ? data : undefined,
    error: success ? undefined : data,
  }),
});

// Mock fetch implementation
export const mockFetch = (responses: Array<{ url?: string; response: any }>) => {
  const fetchMock = jest.fn();
  
  responses.forEach(({ url, response }, index) => {
    if (url) {
      fetchMock.mockImplementationOnce((requestUrl: string) => {
        if (requestUrl.includes(url)) {
          return Promise.resolve(response);
        }
        return Promise.resolve(createMockApiResponse({ error: 'Not found' }, false, 404));
      });
    } else {
      fetchMock.mockResolvedValueOnce(response);
    }
  });

  global.fetch = fetchMock;
  return fetchMock;
};

// Database mock helpers
export const createMockDbResponse = (model: string, method: string, data: any) => ({
  [model]: {
    [method]: jest.fn().mockResolvedValue(data),
  },
});

// Token consumption test helpers
export const mockTokenConsumption = {
  checkBalance: (balance: number) => jest.fn().mockResolvedValue(balance > 0),
  consumeTokens: jest.fn().mockResolvedValue(undefined),
  getTokenCosts: jest.fn().mockReturnValue({
    IDEA_GENERATION: 50,
    COPY_DESIGN: 75,
    COPY_PUBLICATION: 75,
    BASE_IMAGE: 150,
    FINAL_DESIGN: 200,
  }),
};

// API key test helpers
export const mockApiKeyService = {
  validateApiKey: jest.fn(),
  hasPermission: jest.fn(),
  logUsage: jest.fn(),
  createApiKey: jest.fn(),
  revokeApiKey: jest.fn(),
};

// Content generation test data
export const mockContentGenerationJob = {
  id: 'job-test-1',
  status: 'COMPLETED',
  tokensConsumed: 550,
  brandContext: {
    clientId: 'client-test-1',
    brandName: 'Test Brand',
    brandColors: ['#FF0000', '#00FF00'],
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  completedAt: new Date('2024-01-01T00:05:00Z'),
  steps: [
    {
      id: 'step-1',
      step: 'IDEA',
      status: 'COMPLETED',
      output: { idea: 'Test content idea' },
      tokensUsed: 50,
      executedAt: new Date('2024-01-01T00:01:00Z'),
    },
    {
      id: 'step-2',
      step: 'COPY_PUBLICATION',
      status: 'COMPLETED',
      output: { copy: 'Test publication copy' },
      tokensUsed: 75,
      executedAt: new Date('2024-01-01T00:02:00Z'),
    },
    {
      id: 'step-3',
      step: 'FINAL_DESIGN',
      status: 'COMPLETED',
      output: { imageUrl: 'https://example.com/test-image.jpg' },
      tokensUsed: 200,
      executedAt: new Date('2024-01-01T00:05:00Z'),
    },
  ],
};

export const mockClient = {
  id: 'client-test-1',
  brandName: 'Test Brand',
  brandColors: ['#FF0000', '#00FF00'],
  description: 'A test brand for testing purposes',
  logoUrl: 'https://example.com/logo.png',
  whatsappNumber: '+1234567890',
  agencyId: 'agency-test-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  agency: {
    id: 'agency-test-1',
    name: 'Test Agency',
    tokenBalance: 5000,
    subscriptionPlan: 'INTERMEDIATE',
  },
};

export const mockCampaign = {
  id: 'campaign-test-1',
  clientId: 'client-test-1',
  name: 'Test Campaign',
  objective: 'Increase brand awareness',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  brandTone: 'Professional and friendly',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  client: mockClient,
};

export const mockPost = {
  id: 'post-test-1',
  campaignId: 'campaign-test-1',
  scheduledDate: new Date('2024-06-15T12:00:00Z'),
  status: 'DRAFT',
  finalImageUrl: 'https://example.com/post-image.jpg',
  embeddedText: 'Embedded text for the post',
  publicationText: 'Check out our amazing new product! #newproduct #amazing',
  hashtags: ['newproduct', 'amazing', 'testbrand'],
  cta: 'Visit our website to learn more',
  generationJobId: 'job-test-1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  campaign: mockCampaign,
};

// Social media test data
export const mockSocialAccount = {
  id: 'social-test-1',
  clientId: 'client-test-1',
  platform: 'INSTAGRAM',
  accountId: 'instagram_test_123',
  accountName: 'Test Brand Instagram',
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresAt: new Date('2024-12-31T23:59:59Z'),
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockPublicationResult = {
  id: 'pub-test-1',
  postId: 'post-test-1',
  socialAccountId: 'social-test-1',
  platformPostId: 'ig_published_123',
  status: 'PUBLISHED',
  publishedAt: new Date('2024-06-15T12:00:00Z'),
  createdAt: new Date('2024-06-15T12:00:00Z'),
};

// Error test helpers
export const mockError = (code: string, message: string, statusCode: number = 500) => ({
  name: 'PostiaError',
  code,
  message,
  statusCode,
  isOperational: true,
  timestamp: new Date(),
});

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Form test helpers
export const fillForm = (container: HTMLElement, formData: Record<string, string>) => {
  Object.entries(formData).forEach(([name, value]) => {
    const input = container.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
};

// Local storage mock
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Console mock helpers
export const mockConsole = () => {
  const originalConsole = global.console;
  const mockMethods = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    global.console = { ...originalConsole, ...mockMethods };
  });

  afterEach(() => {
    global.console = originalConsole;
    Object.values(mockMethods).forEach(mock => mock.mockClear());
  });

  return mockMethods;
};

// Test data generators
export const generateTestData = {
  user: (overrides: Partial<typeof mockSession.user> = {}) => ({
    ...mockSession.user,
    ...overrides,
  }),
  
  client: (overrides: Partial<typeof mockClient> = {}) => ({
    ...mockClient,
    ...overrides,
  }),
  
  campaign: (overrides: Partial<typeof mockCampaign> = {}) => ({
    ...mockCampaign,
    ...overrides,
  }),
  
  post: (overrides: Partial<typeof mockPost> = {}) => ({
    ...mockPost,
    ...overrides,
  }),
  
  job: (overrides: Partial<typeof mockContentGenerationJob> = {}) => ({
    ...mockContentGenerationJob,
    ...overrides,
  }),
};

// Performance testing helpers
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  label: string = 'Operation'
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

// Memory usage helpers (for Node.js environment)
export const getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return null;
};