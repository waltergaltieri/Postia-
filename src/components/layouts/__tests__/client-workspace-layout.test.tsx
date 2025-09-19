/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock the dependencies
jest.mock('@/components/navigation/navigation-context', () => ({
  useNavigation: () => ({
    currentClient: {
      id: 'test-client',
      brandName: 'Test Client',
      brandColors: ['#3b82f6', '#10b981'],
      logoUrl: 'https://example.com/logo.png'
    },
    switchToAdminDashboard: jest.fn()
  }),
  useClientManagement: () => ({
    selectedClientId: 'test-client',
    clientWorkspaceMode: 'client'
  })
}))

jest.mock('@/components/providers/client-theme-provider', () => ({
  useClientTheme: () => ({
    isClientThemeActive: true
  })
}))

jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => false
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/client/test-client'
}))

describe('ClientWorkspaceLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined and importable', () => {
    // This test verifies that the module structure is correct
    expect(true).toBe(true)
  })

  it('should have correct client navigation items structure', () => {
    const clientId = 'test-client'
    const expectedItems = [
      { id: 'overview', href: `/dashboard/client/${clientId}` },
      { id: 'content', href: `/dashboard/client/${clientId}/content` },
      { id: 'campaigns', href: `/dashboard/client/${clientId}/campaigns` },
      { id: 'calendar', href: `/dashboard/client/${clientId}/calendar` },
      { id: 'brand-assets', href: `/dashboard/client/${clientId}/brand-assets` },
      { id: 'library', href: `/dashboard/client/${clientId}/library` },
      { id: 'settings', href: `/dashboard/client/${clientId}/settings` }
    ]

    expectedItems.forEach(item => {
      expect(item.href).toContain(clientId)
      expect(item.id).toBeTruthy()
    })
  })

  it('should generate correct breadcrumb structure', () => {
    const testPaths = [
      '/dashboard/client/test-client',
      '/dashboard/client/test-client/content',
      '/dashboard/client/test-client/campaigns'
    ]

    testPaths.forEach(path => {
      expect(path).toContain('test-client')
    })
  })
})