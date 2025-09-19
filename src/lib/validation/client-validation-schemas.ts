import { z } from 'zod'

/**
 * Base validation schemas for client data
 */

// Client ID validation
export const clientIdSchema = z.string()
  .min(1, 'Client ID is required')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Client ID must contain only alphanumeric characters, hyphens, and underscores')
  .max(50, 'Client ID must be less than 50 characters')

// Client name validation
export const clientNameSchema = z.string()
  .min(1, 'Client name is required')
  .max(100, 'Client name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_.,&()]+$/, 'Client name contains invalid characters')

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .optional()

// Brand colors validation (JSON array of hex colors)
export const brandColorsSchema = z.array(
  z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
).min(1, 'At least one brand color is required')
.max(5, 'Maximum 5 brand colors allowed')

// Logo URL validation
export const logoUrlSchema = z.string()
  .url('Invalid URL format')
  .max(500, 'Logo URL must be less than 500 characters')
  .optional()

// Theme settings validation
export const themeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid primary color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid secondary color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid accent color format').optional(),
  fontFamily: z.enum(['inter', 'roboto', 'open-sans', 'lato', 'montserrat']).optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  darkMode: z.boolean().optional()
}).optional()

// Workspace settings validation
export const workspaceSettingsSchema = z.object({
  defaultView: z.enum(['campaigns', 'content', 'analytics']).optional(),
  sidebarCollapsed: z.boolean().optional(),
  showWelcomeMessage: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'it']).optional()
}).optional()

/**
 * Client creation validation schema
 */
export const createClientSchema = z.object({
  name: clientNameSchema,
  email: emailSchema,
  brandColors: brandColorsSchema.optional().default(['#3b82f6']),
  logoUrl: logoUrlSchema,
  themeSettings: themeSettingsSchema,
  workspaceSettings: workspaceSettingsSchema,
  isActive: z.boolean().optional().default(true)
})

/**
 * Client update validation schema
 */
export const updateClientSchema = z.object({
  name: clientNameSchema.optional(),
  email: emailSchema,
  brandColors: brandColorsSchema.optional(),
  logoUrl: logoUrlSchema,
  themeSettings: themeSettingsSchema,
  workspaceSettings: workspaceSettingsSchema,
  isActive: z.boolean().optional()
})

/**
 * Client selection validation schema
 */
export const clientSelectionSchema = z.object({
  clientId: clientIdSchema
})

/**
 * Client permissions validation schema
 */
export const clientPermissionsSchema = z.object({
  clientId: clientIdSchema,
  permissions: z.array(
    z.enum([
      'read',
      'write',
      'delete',
      'manage_campaigns',
      'manage_content',
      'view_analytics',
      'export_data',
      'manage_settings'
    ])
  ).min(1, 'At least one permission is required')
})

/**
 * User client assignment validation schema
 */
export const userClientAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  clientIds: z.array(clientIdSchema).min(1, 'At least one client must be assigned'),
  permissions: z.record(
    clientIdSchema,
    z.array(z.string()).min(1, 'At least one permission per client is required')
  )
})

/**
 * Client session validation schema
 */
export const clientSessionSchema = z.object({
  clientId: clientIdSchema,
  sessionData: z.object({
    lastRoute: z.string().max(500).optional(),
    userAgent: z.string().max(1000).optional(),
    preferences: z.record(z.any()).optional()
  }).optional()
})

/**
 * Client search and filtering validation schema
 */
export const clientSearchSchema = z.object({
  query: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['name', 'createdAt', 'lastAccessed']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
})

/**
 * Client analytics request validation schema
 */
export const clientAnalyticsSchema = z.object({
  clientId: clientIdSchema,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z.array(
    z.enum([
      'campaigns_created',
      'content_generated',
      'tokens_consumed',
      'user_activity',
      'performance_metrics'
    ])
  ).min(1, 'At least one metric is required')
})

/**
 * Bulk client operations validation schema
 */
export const bulkClientOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'update_permissions']),
  clientIds: z.array(clientIdSchema).min(1, 'At least one client ID is required').max(50, 'Maximum 50 clients per bulk operation'),
  data: z.record(z.any()).optional() // Additional data for the operation
})

/**
 * Client export validation schema
 */
export const clientExportSchema = z.object({
  clientIds: z.array(clientIdSchema).optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeData: z.object({
    campaigns: z.boolean().optional().default(false),
    content: z.boolean().optional().default(false),
    analytics: z.boolean().optional().default(false),
    settings: z.boolean().optional().default(true)
  }).optional()
})

/**
 * Client import validation schema
 */
export const clientImportSchema = z.object({
  clients: z.array(createClientSchema).min(1, 'At least one client is required').max(100, 'Maximum 100 clients per import'),
  overwriteExisting: z.boolean().optional().default(false),
  validateOnly: z.boolean().optional().default(false)
})

/**
 * API request validation schemas
 */

// GET /api/clients
export const getClientsQuerySchema = clientSearchSchema

// POST /api/clients
export const createClientBodySchema = createClientSchema

// PUT /api/clients/[clientId]
export const updateClientParamsSchema = z.object({
  clientId: clientIdSchema
})
export const updateClientBodySchema = updateClientSchema

// DELETE /api/clients/[clientId]
export const deleteClientParamsSchema = z.object({
  clientId: clientIdSchema
})

// POST /api/clients/switch
export const switchClientBodySchema = clientSelectionSchema

// GET /api/clients/[clientId]/permissions
export const getClientPermissionsParamsSchema = z.object({
  clientId: clientIdSchema
})

// POST /api/clients/[clientId]/permissions
export const updateClientPermissionsParamsSchema = z.object({
  clientId: clientIdSchema
})
export const updateClientPermissionsBodySchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required')
})

// POST /api/admin/clients/bulk
export const bulkClientOperationBodySchema = bulkClientOperationSchema

// GET /api/admin/clients/export
export const exportClientsQuerySchema = clientExportSchema

// POST /api/admin/clients/import
export const importClientsBodySchema = clientImportSchema

/**
 * Validation helper functions
 */

export function validateClientId(clientId: unknown): string {
  return clientIdSchema.parse(clientId)
}

export function validateClientName(name: unknown): string {
  return clientNameSchema.parse(name)
}

export function validateBrandColors(colors: unknown): string[] {
  return brandColorsSchema.parse(colors)
}

export function validateThemeSettings(settings: unknown) {
  return themeSettingsSchema.parse(settings)
}

export function validateWorkspaceSettings(settings: unknown) {
  return workspaceSettingsSchema.parse(settings)
}

/**
 * Sanitization functions
 */

export function sanitizeClientName(name: string): string {
  return name
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100) // Enforce max length
}

export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .substring(0, 255) // Enforce max length
}

export function sanitizeUrl(url: string): string {
  return url
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 500) // Enforce max length
}

export function sanitizeJsonString(jsonString: string): string {
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonString)
    return JSON.stringify(parsed)
  } catch {
    return '{}'
  }
}

export function sanitizeHexColor(color: string): string {
  const cleaned = color.trim().toLowerCase()
  if (cleaned.match(/^#[0-9a-f]{6}$/)) {
    return cleaned
  }
  return '#3b82f6' // Default blue color
}

/**
 * Combined validation and sanitization
 */

export function validateAndSanitizeClientData(data: unknown) {
  const parsed = createClientSchema.parse(data)
  
  return {
    ...parsed,
    name: sanitizeClientName(parsed.name),
    email: parsed.email ? sanitizeEmail(parsed.email) : undefined,
    logoUrl: parsed.logoUrl ? sanitizeUrl(parsed.logoUrl) : undefined,
    brandColors: parsed.brandColors?.map(sanitizeHexColor) || ['#3b82f6']
  }
}

export function validateAndSanitizeClientUpdateData(data: unknown) {
  const parsed = updateClientSchema.parse(data)
  
  return {
    ...parsed,
    name: parsed.name ? sanitizeClientName(parsed.name) : undefined,
    email: parsed.email ? sanitizeEmail(parsed.email) : undefined,
    logoUrl: parsed.logoUrl ? sanitizeUrl(parsed.logoUrl) : undefined,
    brandColors: parsed.brandColors?.map(sanitizeHexColor)
  }
}