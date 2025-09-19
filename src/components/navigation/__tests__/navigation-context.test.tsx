import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import {
  NavigationProvider,
  useNavigation,
  useCurrentClient,
  useClients,
  useWorkflowProgress,
  useClientManagement,
  useClientPermissions,
  useClientSession,
  useRecentClients,
} from '../navigation-context';
import * as clientIsolation from '../../../lib/client-isolation';
import * as clientSession from '../../../lib/client-session';
import { UserRole } from '../../../generated/prisma';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('../../../lib/client-isolation');
jest.mock('../../../lib/client-session');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockClientIsolation = clientIsolation as jest.Mocked<typeof clientIsolation>;
const mockClientSession = clientSession as jest.Mocked<typeof clientSession>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Test component to access context
function TestComponent() {
  const navigation = useNavigation();
  return (
    <div>
      <div data-testid="current-client">
        {navigation.currentClient?.brandName || 'No client'}
      </div>
      <div data-testid="selected-client-id">
        {navigation.selectedClientId || 'No selection'}
      </div>
      <div data-testid="workspace-mode">
        {navigation.clientWorkspaceMode}
      </div>
      <div data-testid="loading">
        {navigation.loading ? 'Loading' : 'Loaded'}
      </div>
      <div data-testid="clients-count">
        {navigation.clients.length}
      </div>
      <button
        data-testid="switch-client"
        onClick={() => navigation.switchToClient('client1')}
      >
        Switch to Client 1
      </button>
      <button
        data-testid="switch-admin"
        onClick={() => navigation.switchToAdminDashboard()}
      >
        Switch to Admin
      </button>
    </div>
  );
}

function TestHooksComponent() {
  const { currentClient } = useCurrentClient();
  const { clients } = useClients();
  const { workflowStep, totalSteps } = useWorkflowProgress();
  const { selectedClientId, clientWorkspaceMode } = useClientManagement();
  const { clientPermissions, hasPermission } = useClientPermissions();
  const { persistClientSelection } = useClientSession();
  const { recentClients } = useRecentClients();

  return (
    <div>
      <div data-testid="hook-current-client">
        {currentClient?.brandName || 'No client'}
      </div>
      <div data-testid="hook-clients-count">{clients.length}</div>
      <div data-testid="hook-workflow">{workflowStep}/{totalSteps}</div>
      <div data-testid="hook-selected-client">{selectedClientId || 'None'}</div>
      <div data-testid="hook-workspace-mode">{clientWorkspaceMode}</div>
      <div data-testid="hook-permissions-count">{clientPermissions.length}</div>
      <div data-testid="hook-has-write-permission">
        {hasPermission('write') ? 'Yes' : 'No'}
      </div>
      <div data-testid="hook-persist-selection">
        {persistClientSelection ? 'Yes' : 'No'}
      </div>
      <div data-testid="hook-recent-clients-count">{recentClients.length}</div>
    </div>
  );
}

describe('NavigationProvider', () => {
  const mockSession = {
    user: {
      id: 'user1',
      role: UserRole.MANAGER,
      email: 'test@example.com',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };

  const mockClients = [
    {
      id: 'client1',
      name: 'Client One',
      brandColors: '["#ff0000", "#00ff00"]',
      logoUrl: 'https://example.com/logo1.png',
    },
    {
      id: 'client2',
      name: 'Client Two',
      brandColors: '["#0000ff"]',
      logoUrl: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock successful clients fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { clients: mockClients },
      }),
    } as Response);

    // Mock client isolation functions
    mockClientIsolation.validateClientAccess.mockResolvedValue(true);
    (mockClientIsolation.ClientAccessError as any) = class extends Error {
      constructor(userId: string, clientId: string, message?: string) {
        super(message || `User ${userId} does not have access to client ${clientId}`);
        this.name = 'ClientAccessError';
      }
    };

    // Mock client session functions
    (mockClientSession.ClientSelectionStorage as any) = {
      saveClientSelection: jest.fn(),
      getClientSelection: jest.fn().mockReturnValue(null),
      clearClientSelection: jest.fn(),
      hasValidClientSelection: jest.fn().mockReturnValue(false),
    };
    mockClientSession.createOrUpdateClientSession.mockResolvedValue();
    mockClientSession.getRecentClientsForUser.mockResolvedValue([]);
  });

  it('should provide navigation context to children', async () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(screen.getByTestId('current-client')).toHaveTextContent('No client');
    expect(screen.getByTestId('selected-client-id')).toHaveTextContent('No selection');
    expect(screen.getByTestId('workspace-mode')).toHaveTextContent('admin');
    expect(screen.getByTestId('clients-count')).toHaveTextContent('2');
  });

  it('should fetch clients on session load', async () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/clients');
    });

    await waitFor(() => {
      expect(screen.getByTestId('clients-count')).toHaveTextContent('2');
    });
  });

  it('should handle client switching', async () => {
    // Mock permissions fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { clients: mockClients },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { permissions: ['read', 'write'] },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      screen.getByTestId('switch-client').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-client')).toHaveTextContent('Client One');
      expect(screen.getByTestId('selected-client-id')).toHaveTextContent('client1');
      expect(screen.getByTestId('workspace-mode')).toHaveTextContent('client');
    });

    expect(mockClientIsolation.validateClientAccess).toHaveBeenCalledWith(
      'user1',
      UserRole.MANAGER,
      'client1'
    );
    expect((mockClientSession.ClientSelectionStorage as any).saveClientSelection).toHaveBeenCalledWith('client1');
    expect(mockClientSession.createOrUpdateClientSession).toHaveBeenCalledWith(
      'user1',
      'client1',
      expect.objectContaining({
        lastRoute: expect.any(String),
        userAgent: expect.any(String),
      })
    );
  });

  it('should handle admin dashboard switching', async () => {
    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      screen.getByTestId('switch-admin').click();
    });

    expect(screen.getByTestId('current-client')).toHaveTextContent('No client');
    expect(screen.getByTestId('selected-client-id')).toHaveTextContent('No selection');
    expect(screen.getByTestId('workspace-mode')).toHaveTextContent('admin');
    expect((mockClientSession.ClientSelectionStorage as any).clearClientSelection).toHaveBeenCalled();
  });

  it('should handle client access errors', async () => {
    mockClientIsolation.validateClientAccess.mockRejectedValue(
      new mockClientIsolation.ClientAccessError('user1', 'client1', 'Access denied')
    );

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    await act(async () => {
      expect(async () => {
        await screen.getByTestId('switch-client').click();
      }).rejects.toThrow();
    });
  });

  it('should handle no session gracefully', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(screen.getByTestId('clients-count')).toHaveTextContent('0');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    expect(screen.getByTestId('clients-count')).toHaveTextContent('0');
  });

  it('should restore last client selection', async () => {
    (mockClientSession.ClientSelectionStorage as any).getClientSelection.mockReturnValue('client1');
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { clients: mockClients },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { lastSelectedClient: 'client1' },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { permissions: ['read'] },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <NavigationProvider>
        <TestComponent />
      </NavigationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-client')).toHaveTextContent('Client One');
      expect(screen.getByTestId('selected-client-id')).toHaveTextContent('client1');
    });
  });

  describe('Custom Hooks', () => {
    it('should provide specialized hook functionality', async () => {
      mockClientSession.getRecentClientsForUser.mockResolvedValue([
        {
          clientId: 'client1',
          clientName: 'Client One',
          lastAccessed: new Date(),
        },
      ]);

      render(
        <NavigationProvider>
          <TestHooksComponent />
        </NavigationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('hook-current-client')).toHaveTextContent('No client');
        expect(screen.getByTestId('hook-clients-count')).toHaveTextContent('2');
        expect(screen.getByTestId('hook-workflow')).toHaveTextContent('0/0');
        expect(screen.getByTestId('hook-selected-client')).toHaveTextContent('None');
        expect(screen.getByTestId('hook-workspace-mode')).toHaveTextContent('admin');
        expect(screen.getByTestId('hook-permissions-count')).toHaveTextContent('0');
        expect(screen.getByTestId('hook-has-write-permission')).toHaveTextContent('No');
        expect(screen.getByTestId('hook-persist-selection')).toHaveTextContent('Yes');
      });

      await waitFor(() => {
        expect(screen.getByTestId('hook-recent-clients-count')).toHaveTextContent('1');
      });
    });
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNavigation must be used within a NavigationProvider');

    consoleSpy.mockRestore();
  });

  it('should handle breadcrumb management', async () => {
    function BreadcrumbTestComponent() {
      const { breadcrumbs, addBreadcrumb, removeBreadcrumb } = useNavigation();

      return (
        <div>
          <div data-testid="breadcrumbs-count">{breadcrumbs.length}</div>
          <button
            data-testid="add-breadcrumb"
            onClick={() => addBreadcrumb({ label: 'Test', href: '/test' })}
          >
            Add Breadcrumb
          </button>
          <button
            data-testid="remove-breadcrumb"
            onClick={() => removeBreadcrumb('/test')}
          >
            Remove Breadcrumb
          </button>
        </div>
      );
    }

    render(
      <NavigationProvider>
        <BreadcrumbTestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByTestId('add-breadcrumb').click();
    });

    expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('1');

    await act(async () => {
      screen.getByTestId('remove-breadcrumb').click();
    });

    expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('0');
  });

  it('should handle workflow progress management', async () => {
    function WorkflowTestComponent() {
      const { workflowStep, totalSteps, setWorkflowProgress } = useNavigation();

      return (
        <div>
          <div data-testid="workflow-progress">{workflowStep}/{totalSteps}</div>
          <button
            data-testid="set-progress"
            onClick={() => setWorkflowProgress(3, 5)}
          >
            Set Progress
          </button>
        </div>
      );
    }

    render(
      <NavigationProvider>
        <WorkflowTestComponent />
      </NavigationProvider>
    );

    expect(screen.getByTestId('workflow-progress')).toHaveTextContent('0/0');

    await act(async () => {
      screen.getByTestId('set-progress').click();
    });

    expect(screen.getByTestId('workflow-progress')).toHaveTextContent('3/5');
  });
});