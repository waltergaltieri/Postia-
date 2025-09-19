import { db } from './db'

/**
 * Client session management utilities
 */

export interface ClientSessionData {
  timestamp: string
  userAgent?: string
  lastRoute?: string
  workflowState?: any
  preferences?: Record<string, any>
}

/**
 * Create or update a client session
 */
export async function createOrUpdateClientSession(
  userId: string,
  clientId: string,
  sessionData?: Partial<ClientSessionData>
): Promise<void> {
  try {
    const data: ClientSessionData = {
      timestamp: new Date().toISOString(),
      ...sessionData
    }

    await db.clientSession.upsert({
      where: {
        userId_clientId: {
          userId,
          clientId
        }
      },
      update: {
        lastAccessed: new Date(),
        sessionData: JSON.stringify(data)
      },
      create: {
        userId,
        clientId,
        sessionData: JSON.stringify(data)
      }
    })
  } catch (error) {
    console.error('Error creating/updating client session:', error)
    throw error
  }
}

/**
 * Get client session data
 */
export async function getClientSession(
  userId: string,
  clientId: string
): Promise<ClientSessionData | null> {
  try {
    const session = await db.clientSession.findUnique({
      where: {
        userId_clientId: {
          userId,
          clientId
        }
      }
    })

    if (!session?.sessionData) {
      return null
    }

    return JSON.parse(session.sessionData) as ClientSessionData
  } catch (error) {
    console.error('Error getting client session:', error)
    return null
  }
}

/**
 * Update client session with new data
 */
export async function updateClientSessionData(
  userId: string,
  clientId: string,
  updates: Partial<ClientSessionData>
): Promise<void> {
  try {
    const existingSession = await getClientSession(userId, clientId)
    const updatedData: ClientSessionData = {
      ...existingSession,
      ...updates,
      timestamp: new Date().toISOString()
    }

    await db.clientSession.update({
      where: {
        userId_clientId: {
          userId,
          clientId
        }
      },
      data: {
        lastAccessed: new Date(),
        sessionData: JSON.stringify(updatedData)
      }
    })
  } catch (error) {
    console.error('Error updating client session data:', error)
    throw error
  }
}

/**
 * Delete client session
 */
export async function deleteClientSession(
  userId: string,
  clientId: string
): Promise<void> {
  try {
    await db.clientSession.delete({
      where: {
        userId_clientId: {
          userId,
          clientId
        }
      }
    })
  } catch (error) {
    console.error('Error deleting client session:', error)
    // Don't throw error for delete operations
  }
}

/**
 * Get all client sessions for a user
 */
export async function getUserClientSessions(userId: string): Promise<Array<{
  clientId: string
  lastAccessed: Date
  sessionData: ClientSessionData | null
}>> {
  try {
    const sessions = await db.clientSession.findMany({
      where: { userId },
      orderBy: { lastAccessed: 'desc' }
    })

    return sessions.map(session => ({
      clientId: session.clientId,
      lastAccessed: session.lastAccessed,
      sessionData: session.sessionData ? JSON.parse(session.sessionData) : null
    }))
  } catch (error) {
    console.error('Error getting user client sessions:', error)
    return []
  }
}

/**
 * Clean up old client sessions (older than 30 days)
 */
export async function cleanupOldClientSessions(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await db.clientSession.deleteMany({
      where: {
        lastAccessed: {
          lt: thirtyDaysAgo
        }
      }
    })

    return result.count
  } catch (error) {
    console.error('Error cleaning up old client sessions:', error)
    return 0
  }
}

/**
 * Get recent clients for a user (based on session activity)
 */
export async function getRecentClientsForUser(
  userId: string,
  limit: number = 5
): Promise<Array<{
  clientId: string
  clientName: string
  lastAccessed: Date
}>> {
  try {
    const sessions = await db.clientSession.findMany({
      where: { userId },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { lastAccessed: 'desc' },
      take: limit
    })

    return sessions.map(session => ({
      clientId: session.clientId,
      clientName: session.client.name,
      lastAccessed: session.lastAccessed
    }))
  } catch (error) {
    console.error('Error getting recent clients:', error)
    return []
  }
}

/**
 * Browser storage utilities for client selection persistence
 */
export class ClientSelectionStorage {
  private static readonly STORAGE_KEY = 'selectedClientId'
  private static readonly STORAGE_TIMESTAMP_KEY = 'selectedClientTimestamp'
  private static readonly MAX_AGE_HOURS = 24 // 24 hours

  /**
   * Save client selection to localStorage
   */
  static saveClientSelection(clientId: string | null): void {
    try {
      if (typeof window === 'undefined') return

      if (clientId) {
        localStorage.setItem(this.STORAGE_KEY, clientId)
        localStorage.setItem(this.STORAGE_TIMESTAMP_KEY, new Date().toISOString())
      } else {
        localStorage.removeItem(this.STORAGE_KEY)
        localStorage.removeItem(this.STORAGE_TIMESTAMP_KEY)
      }
    } catch (error) {
      console.error('Error saving client selection to localStorage:', error)
    }
  }

  /**
   * Get client selection from localStorage
   */
  static getClientSelection(): string | null {
    try {
      if (typeof window === 'undefined') return null

      const clientId = localStorage.getItem(this.STORAGE_KEY)
      const timestamp = localStorage.getItem(this.STORAGE_TIMESTAMP_KEY)

      if (!clientId || !timestamp) return null

      // Check if selection is too old
      const savedTime = new Date(timestamp)
      const now = new Date()
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > this.MAX_AGE_HOURS) {
        this.clearClientSelection()
        return null
      }

      return clientId
    } catch (error) {
      console.error('Error getting client selection from localStorage:', error)
      return null
    }
  }

  /**
   * Clear client selection from localStorage
   */
  static clearClientSelection(): void {
    try {
      if (typeof window === 'undefined') return

      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.STORAGE_TIMESTAMP_KEY)
    } catch (error) {
      console.error('Error clearing client selection from localStorage:', error)
    }
  }

  /**
   * Check if client selection exists and is valid
   */
  static hasValidClientSelection(): boolean {
    return this.getClientSelection() !== null
  }
}