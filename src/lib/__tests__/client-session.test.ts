import {
  createOrUpdateClientSession,
  getClientSession,
  updateClientSessionData,
  deleteClientSession,
  getUserClientSessions,
  cleanupOldClientSessions,
  getRecentClientsForUser,
  ClientSelectionStorage,
  ClientSessionData,
} from '../client-session';
import { db } from '../db';

// Mock the database
jest.mock('../db', () => ({
  db: {
    clientSession: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
});

describe('Client Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('createOrUpdateClientSession', () => {
    it('should create new client session with default data', async () => {
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate.toISOString());

      mockDb.clientSession.upsert.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: mockDate,
        sessionData: JSON.stringify({ timestamp: mockDate.toISOString() })
      });

      await createOrUpdateClientSession('user1', 'client1');

      expect(mockDb.clientSession.upsert).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        },
        update: {
          lastAccessed: expect.any(Date),
          sessionData: JSON.stringify({ timestamp: mockDate.toISOString() })
        },
        create: {
          userId: 'user1',
          clientId: 'client1',
          sessionData: JSON.stringify({ timestamp: mockDate.toISOString() })
        }
      });
    });

    it('should create client session with custom data', async () => {
      const customData = {
        userAgent: 'custom-agent',
        lastRoute: '/dashboard',
        preferences: { theme: 'dark' }
      };

      await createOrUpdateClientSession('user1', 'client1', customData);

      expect(mockDb.clientSession.upsert).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        },
        update: {
          lastAccessed: expect.any(Date),
          sessionData: expect.stringContaining('"userAgent":"custom-agent"')
        },
        create: {
          userId: 'user1',
          clientId: 'client1',
          sessionData: expect.stringContaining('"userAgent":"custom-agent"')
        }
      });
    });

    it('should handle database errors', async () => {
      mockDb.clientSession.upsert.mockRejectedValue(new Error('Database error'));

      await expect(
        createOrUpdateClientSession('user1', 'client1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getClientSession', () => {
    it('should return parsed session data', async () => {
      const sessionData = {
        timestamp: '2023-01-01T12:00:00Z',
        userAgent: 'test-agent',
        lastRoute: '/dashboard'
      };

      mockDb.clientSession.findUnique.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: JSON.stringify(sessionData)
      });

      const result = await getClientSession('user1', 'client1');

      expect(result).toEqual(sessionData);
      expect(mockDb.clientSession.findUnique).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        }
      });
    });

    it('should return null if session not found', async () => {
      mockDb.clientSession.findUnique.mockResolvedValue(null);

      const result = await getClientSession('user1', 'client1');
      expect(result).toBeNull();
    });

    it('should return null if sessionData is null', async () => {
      mockDb.clientSession.findUnique.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: null
      });

      const result = await getClientSession('user1', 'client1');
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockDb.clientSession.findUnique.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: 'invalid json'
      });

      const result = await getClientSession('user1', 'client1');
      expect(result).toBeNull();
    });
  });

  describe('updateClientSessionData', () => {
    it('should update session with merged data', async () => {
      const existingData = {
        timestamp: '2023-01-01T10:00:00Z',
        userAgent: 'old-agent',
        lastRoute: '/old-route'
      };

      const updates = {
        lastRoute: '/new-route',
        preferences: { theme: 'dark' }
      };

      mockDb.clientSession.findUnique.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: JSON.stringify(existingData)
      });

      await updateClientSessionData('user1', 'client1', updates);

      expect(mockDb.clientSession.update).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        },
        data: {
          lastAccessed: expect.any(Date),
          sessionData: expect.stringContaining('"lastRoute":"/new-route"')
        }
      });
    });

    it('should handle missing existing session', async () => {
      mockDb.clientSession.findUnique.mockResolvedValue(null);

      const updates = { lastRoute: '/new-route' };

      await updateClientSessionData('user1', 'client1', updates);

      expect(mockDb.clientSession.update).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        },
        data: {
          lastAccessed: expect.any(Date),
          sessionData: expect.stringContaining('"lastRoute":"/new-route"')
        }
      });
    });
  });

  describe('deleteClientSession', () => {
    it('should delete client session', async () => {
      mockDb.clientSession.delete.mockResolvedValue({
        id: 'session1',
        userId: 'user1',
        clientId: 'client1',
        lastAccessed: new Date(),
        sessionData: null
      });

      await deleteClientSession('user1', 'client1');

      expect(mockDb.clientSession.delete).toHaveBeenCalledWith({
        where: {
          userId_clientId: {
            userId: 'user1',
            clientId: 'client1'
          }
        }
      });
    });

    it('should not throw on delete errors', async () => {
      mockDb.clientSession.delete.mockRejectedValue(new Error('Delete error'));

      await expect(deleteClientSession('user1', 'client1')).resolves.not.toThrow();
    });
  });

  describe('getUserClientSessions', () => {
    it('should return user sessions with parsed data', async () => {
      const sessionData1 = { timestamp: '2023-01-01T12:00:00Z' };
      const sessionData2 = { timestamp: '2023-01-02T12:00:00Z' };

      mockDb.clientSession.findMany.mockResolvedValue([
        {
          id: 'session1',
          userId: 'user1',
          clientId: 'client1',
          lastAccessed: new Date('2023-01-02'),
          sessionData: JSON.stringify(sessionData1)
        },
        {
          id: 'session2',
          userId: 'user1',
          clientId: 'client2',
          lastAccessed: new Date('2023-01-01'),
          sessionData: JSON.stringify(sessionData2)
        }
      ]);

      const result = await getUserClientSessions('user1');

      expect(result).toHaveLength(2);
      expect(result[0].clientId).toBe('client1');
      expect(result[0].sessionData).toEqual(sessionData1);
      expect(result[1].clientId).toBe('client2');
      expect(result[1].sessionData).toEqual(sessionData2);

      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { lastAccessed: 'desc' }
      });
    });

    it('should handle sessions with null sessionData', async () => {
      mockDb.clientSession.findMany.mockResolvedValue([
        {
          id: 'session1',
          userId: 'user1',
          clientId: 'client1',
          lastAccessed: new Date(),
          sessionData: null
        }
      ]);

      const result = await getUserClientSessions('user1');

      expect(result).toHaveLength(1);
      expect(result[0].sessionData).toBeNull();
    });

    it('should return empty array on database error', async () => {
      mockDb.clientSession.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getUserClientSessions('user1');
      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldClientSessions', () => {
    it('should delete sessions older than 30 days', async () => {
      mockDb.clientSession.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupOldClientSessions();

      expect(result).toBe(5);
      expect(mockDb.clientSession.deleteMany).toHaveBeenCalledWith({
        where: {
          lastAccessed: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should return 0 on database error', async () => {
      mockDb.clientSession.deleteMany.mockRejectedValue(new Error('Database error'));

      const result = await cleanupOldClientSessions();
      expect(result).toBe(0);
    });
  });

  describe('getRecentClientsForUser', () => {
    it('should return recent clients with names', async () => {
      mockDb.clientSession.findMany.mockResolvedValue([
        {
          id: 'session1',
          userId: 'user1',
          clientId: 'client1',
          lastAccessed: new Date('2023-01-02'),
          sessionData: null,
          client: { id: 'client1', name: 'Client One' }
        },
        {
          id: 'session2',
          userId: 'user1',
          clientId: 'client2',
          lastAccessed: new Date('2023-01-01'),
          sessionData: null,
          client: { id: 'client2', name: 'Client Two' }
        }
      ]);

      const result = await getRecentClientsForUser('user1', 3);

      expect(result).toEqual([
        {
          clientId: 'client1',
          clientName: 'Client One',
          lastAccessed: new Date('2023-01-02')
        },
        {
          clientId: 'client2',
          clientName: 'Client Two',
          lastAccessed: new Date('2023-01-01')
        }
      ]);

      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { lastAccessed: 'desc' },
        take: 3
      });
    });

    it('should use default limit of 5', async () => {
      mockDb.clientSession.findMany.mockResolvedValue([]);

      await getRecentClientsForUser('user1');

      expect(mockDb.clientSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });

    it('should return empty array on database error', async () => {
      mockDb.clientSession.findMany.mockRejectedValue(new Error('Database error'));

      const result = await getRecentClientsForUser('user1');
      expect(result).toEqual([]);
    });
  });

  describe('ClientSelectionStorage', () => {
    let originalWindow: any;

    beforeEach(() => {
      // Save original window
      originalWindow = (global as any).window;
      // Mock window object
      (global as any).window = { localStorage: localStorageMock };
    });

    afterEach(() => {
      // Restore original window
      (global as any).window = originalWindow;
    });

    describe('saveClientSelection', () => {
      it('should save client selection to localStorage', () => {
        ClientSelectionStorage.saveClientSelection('client123');

        expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedClientId', 'client123');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'selectedClientTimestamp',
          expect.any(String)
        );
      });

      it('should remove client selection when null', () => {
        ClientSelectionStorage.saveClientSelection(null);

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientId');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientTimestamp');
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          ClientSelectionStorage.saveClientSelection('client123');
        }).not.toThrow();
      });

      it('should handle server-side rendering (no window)', () => {
        delete (global as any).window;

        expect(() => {
          ClientSelectionStorage.saveClientSelection('client123');
        }).not.toThrow();
      });
    });

    describe('getClientSelection', () => {
      it('should return client selection if valid and recent', () => {
        const recentTimestamp = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
        localStorageMock.getItem
          .mockReturnValueOnce('client123')
          .mockReturnValueOnce(recentTimestamp);

        const result = ClientSelectionStorage.getClientSelection();
        expect(result).toBe('client123');
      });

      it('should return null if client selection is too old', () => {
        const oldTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(); // 25 hours ago
        localStorageMock.getItem
          .mockReturnValueOnce('client123')
          .mockReturnValueOnce(oldTimestamp);

        const result = ClientSelectionStorage.getClientSelection();
        expect(result).toBeNull();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientId');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientTimestamp');
      });

      it('should return null if no client selection stored', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = ClientSelectionStorage.getClientSelection();
        expect(result).toBeNull();
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        const result = ClientSelectionStorage.getClientSelection();
        expect(result).toBeNull();
      });

      it('should handle server-side rendering (no window)', () => {
        delete (global as any).window;

        const result = ClientSelectionStorage.getClientSelection();
        expect(result).toBeNull();
      });
    });

    describe('clearClientSelection', () => {
      it('should clear client selection from localStorage', () => {
        ClientSelectionStorage.clearClientSelection();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientId');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedClientTimestamp');
      });

      it('should handle localStorage errors gracefully', () => {
        localStorageMock.removeItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => {
          ClientSelectionStorage.clearClientSelection();
        }).not.toThrow();
      });
    });

    describe('hasValidClientSelection', () => {
      it('should return true if valid selection exists', () => {
        const recentTimestamp = new Date(Date.now() - 1000 * 60 * 60).toISOString();
        localStorageMock.getItem
          .mockReturnValueOnce('client123')
          .mockReturnValueOnce(recentTimestamp);

        const result = ClientSelectionStorage.hasValidClientSelection();
        expect(result).toBe(true);
      });

      it('should return false if no valid selection exists', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = ClientSelectionStorage.hasValidClientSelection();
        expect(result).toBe(false);
      });
    });
  });
});