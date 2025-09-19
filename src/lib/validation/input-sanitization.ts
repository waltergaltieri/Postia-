/**
 * Input sanitization utilities for client-specific data
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Simple implementation without external dependencies
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
}

/**
 * Sanitize client name with business rules
 */
export function sanitizeClientName(name: string): string {
  return sanitizeText(name)
    .replace(/[^\w\s\-_.,&()]/g, '') // Allow only safe characters for business names
    .substring(0, 100) // Enforce max length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Allow only valid email characters
    .substring(0, 255) // Enforce max length
}

/**
 * Sanitize URL with validation
 */
export function sanitizeUrl(url: string): string {
  const cleaned = url.trim()
  
  // Basic URL validation
  try {
    const urlObj = new URL(cleaned)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol')
    }
    
    return urlObj.toString().substring(0, 500) // Enforce max length
  } catch {
    return '' // Return empty string for invalid URLs
  }
}

/**
 * Sanitize hex color code
 */
export function sanitizeHexColor(color: string): string {
  const cleaned = color.trim().toLowerCase()
  
  // Validate hex color format
  if (cleaned.match(/^#[0-9a-f]{6}$/)) {
    return cleaned
  }
  
  // Try to fix common issues
  if (cleaned.match(/^[0-9a-f]{6}$/)) {
    return `#${cleaned}`
  }
  
  if (cleaned.match(/^#[0-9a-f]{3}$/)) {
    // Convert 3-digit hex to 6-digit
    const [, r, g, b] = cleaned
    return `#${r}${r}${g}${g}${b}${b}`
  }
  
  // Return default color for invalid input
  return '#3b82f6'
}

/**
 * Sanitize JSON string
 */
export function sanitizeJsonString(jsonString: string, maxDepth: number = 5): string {
  try {
    const parsed = JSON.parse(jsonString)
    
    // Check for excessive nesting to prevent DoS attacks
    const checkDepth = (obj: any, depth: number = 0): boolean => {
      if (depth > maxDepth) return false
      
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (!checkDepth(obj[key], depth + 1)) {
            return false
          }
        }
      }
      
      return true
    }
    
    if (!checkDepth(parsed)) {
      throw new Error('JSON too deeply nested')
    }
    
    // Re-stringify to ensure clean JSON
    return JSON.stringify(parsed)
  } catch {
    return '{}'
  }
}

/**
 * Sanitize client settings object
 */
export function sanitizeClientSettings(settings: any): string {
  if (!settings || typeof settings !== 'object') {
    return '{}'
  }
  
  const sanitized: any = {}
  
  // Sanitize known settings fields
  if (settings.primaryColor) {
    sanitized.primaryColor = sanitizeHexColor(settings.primaryColor)
  }
  
  if (settings.secondaryColor) {
    sanitized.secondaryColor = sanitizeHexColor(settings.secondaryColor)
  }
  
  if (settings.accentColor) {
    sanitized.accentColor = sanitizeHexColor(settings.accentColor)
  }
  
  if (settings.fontFamily) {
    const allowedFonts = ['inter', 'roboto', 'open-sans', 'lato', 'montserrat']
    sanitized.fontFamily = allowedFonts.includes(settings.fontFamily) ? settings.fontFamily : 'inter'
  }
  
  if (settings.borderRadius) {
    const allowedRadius = ['none', 'sm', 'md', 'lg', 'xl']
    sanitized.borderRadius = allowedRadius.includes(settings.borderRadius) ? settings.borderRadius : 'md'
  }
  
  if (typeof settings.darkMode === 'boolean') {
    sanitized.darkMode = settings.darkMode
  }
  
  return JSON.stringify(sanitized)
}

/**
 * Sanitize workspace settings object
 */
export function sanitizeWorkspaceSettings(settings: any): string {
  if (!settings || typeof settings !== 'object') {
    return '{}'
  }
  
  const sanitized: any = {}
  
  if (settings.defaultView) {
    const allowedViews = ['campaigns', 'content', 'analytics']
    sanitized.defaultView = allowedViews.includes(settings.defaultView) ? settings.defaultView : 'campaigns'
  }
  
  if (typeof settings.sidebarCollapsed === 'boolean') {
    sanitized.sidebarCollapsed = settings.sidebarCollapsed
  }
  
  if (typeof settings.showWelcomeMessage === 'boolean') {
    sanitized.showWelcomeMessage = settings.showWelcomeMessage
  }
  
  if (typeof settings.enableNotifications === 'boolean') {
    sanitized.enableNotifications = settings.enableNotifications
  }
  
  if (settings.timezone) {
    // Basic timezone validation
    const timezoneRegex = /^[A-Za-z_\/]+$/
    sanitized.timezone = timezoneRegex.test(settings.timezone) ? settings.timezone.substring(0, 50) : 'UTC'
  }
  
  if (settings.language) {
    const allowedLanguages = ['en', 'es', 'fr', 'de', 'it']
    sanitized.language = allowedLanguages.includes(settings.language) ? settings.language : 'en'
  }
  
  return JSON.stringify(sanitized)
}

/**
 * Sanitize brand colors array
 */
export function sanitizeBrandColors(colors: any): string {
  if (!Array.isArray(colors)) {
    return JSON.stringify(['#3b82f6'])
  }
  
  const sanitizedColors = colors
    .slice(0, 5) // Limit to 5 colors
    .map(color => sanitizeHexColor(String(color)))
    .filter(color => color !== '#3b82f6' || colors.length === 1) // Remove default colors unless it's the only one
  
  // Ensure at least one color
  if (sanitizedColors.length === 0) {
    sanitizedColors.push('#3b82f6')
  }
  
  return JSON.stringify(sanitizedColors)
}

/**
 * Sanitize client permissions array
 */
export function sanitizeClientPermissions(permissions: any): string {
  if (!Array.isArray(permissions)) {
    return JSON.stringify([])
  }
  
  const allowedPermissions = [
    'read',
    'write',
    'delete',
    'manage_campaigns',
    'manage_content',
    'view_analytics',
    'export_data',
    'manage_settings'
  ]
  
  const sanitizedPermissions = permissions
    .filter(permission => typeof permission === 'string')
    .map(permission => permission.toLowerCase().trim())
    .filter(permission => allowedPermissions.includes(permission))
    .filter((permission, index, array) => array.indexOf(permission) === index) // Remove duplicates
  
  return JSON.stringify(sanitizedPermissions)
}

/**
 * Sanitize user input for search queries
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeText(query)
    .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE wildcards
    .substring(0, 100) // Limit search query length
}

/**
 * Sanitize file names for client assets
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Enforce max length
}

/**
 * Sanitize client metadata
 */
export function sanitizeClientMetadata(metadata: any): string {
  if (!metadata || typeof metadata !== 'object') {
    return '{}'
  }
  
  const sanitized: any = {}
  
  // Only allow specific metadata fields
  const allowedFields = [
    'industry',
    'company_size',
    'website',
    'phone',
    'address',
    'notes',
    'tags',
    'custom_fields'
  ]
  
  for (const field of allowedFields) {
    if (metadata[field] !== undefined) {
      switch (field) {
        case 'website':
          sanitized[field] = sanitizeUrl(String(metadata[field]))
          break
        case 'phone':
          sanitized[field] = String(metadata[field]).replace(/[^\d\s\-\+\(\)]/g, '').substring(0, 20)
          break
        case 'tags':
          if (Array.isArray(metadata[field])) {
            sanitized[field] = metadata[field]
              .slice(0, 10) // Limit to 10 tags
              .map((tag: any) => sanitizeText(String(tag)).substring(0, 50))
              .filter((tag: string) => tag.length > 0)
          }
          break
        case 'custom_fields':
          if (typeof metadata[field] === 'object' && metadata[field] !== null) {
            const customFields: any = {}
            const entries = Object.entries(metadata[field]).slice(0, 20) // Limit to 20 custom fields
            
            for (const [key, value] of entries) {
              const sanitizedKey = sanitizeText(String(key)).substring(0, 50)
              const sanitizedValue = sanitizeText(String(value)).substring(0, 500)
              
              if (sanitizedKey && sanitizedValue) {
                customFields[sanitizedKey] = sanitizedValue
              }
            }
            
            sanitized[field] = customFields
          }
          break
        default:
          sanitized[field] = sanitizeText(String(metadata[field])).substring(0, 500)
      }
    }
  }
  
  return JSON.stringify(sanitized)
}

/**
 * Comprehensive client data sanitization
 */
export function sanitizeClientData(data: any): any {
  if (!data || typeof data !== 'object') {
    return {}
  }
  
  const sanitized: any = {}
  
  if (data.name) {
    sanitized.name = sanitizeClientName(data.name)
  }
  
  if (data.email) {
    sanitized.email = sanitizeEmail(data.email)
  }
  
  if (data.logoUrl) {
    sanitized.logoUrl = sanitizeUrl(data.logoUrl)
  }
  
  if (data.brandColors) {
    sanitized.brandColors = sanitizeBrandColors(data.brandColors)
  }
  
  if (data.themeSettings) {
    sanitized.themeSettings = sanitizeClientSettings(data.themeSettings)
  }
  
  if (data.workspaceSettings) {
    sanitized.workspaceSettings = sanitizeWorkspaceSettings(data.workspaceSettings)
  }
  
  if (typeof data.isActive === 'boolean') {
    sanitized.isActive = data.isActive
  }
  
  if (data.metadata) {
    sanitized.metadata = sanitizeClientMetadata(data.metadata)
  }
  
  return sanitized
}

/**
 * Rate limiting helpers for input validation
 */
export function createInputRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, number[]>()
  
  return function checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests for this identifier
    const userRequests = requests.get(identifier) || []
    
    // Filter out old requests
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    // Add current request
    recentRequests.push(now)
    requests.set(identifier, recentRequests)
    
    return true
  }
}

/**
 * Input validation middleware helper
 */
export function validateAndSanitizeInput<T>(
  input: unknown,
  validator: (input: unknown) => T,
  sanitizer?: (input: T) => T
): T {
  try {
    const validated = validator(input)
    return sanitizer ? sanitizer(validated) : validated
  } catch (error) {
    throw new Error(`Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}