import React from 'react'
import { z } from 'zod'
import { 
  sanitizeClientName, 
  sanitizeEmail, 
  sanitizeUrl, 
  sanitizeHexColor,
  sanitizeClientSettings,
  sanitizeWorkspaceSettings,
  sanitizeBrandColors
} from './input-sanitization'

/**
 * Form validation utilities for client management
 */

export interface ClientFormData {
  name: string
  email?: string
  logoUrl?: string
  brandColors: string[]
  themeSettings?: any
  workspaceSettings?: any
  isActive: boolean
}

export interface ClientFormErrors {
  name?: string
  email?: string
  logoUrl?: string
  brandColors?: string
  themeSettings?: string
  workspaceSettings?: string
  isActive?: string
  general?: string
}

/**
 * Real-time form validation for client name
 */
export function validateClientNameField(name: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeClientName(name)
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, error: 'Client name is required', sanitized }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Client name must be at least 2 characters', sanitized }
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Client name must be less than 100 characters', sanitized }
  }
  
  if (!/^[a-zA-Z0-9\s\-_.,&()]+$/.test(sanitized)) {
    return { isValid: false, error: 'Client name contains invalid characters', sanitized }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Real-time form validation for email
 */
export function validateEmailField(email: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeEmail(email)
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: true, sanitized } // Email is optional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format', sanitized }
  }
  
  if (sanitized.length > 255) {
    return { isValid: false, error: 'Email must be less than 255 characters', sanitized }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Real-time form validation for logo URL
 */
export function validateLogoUrlField(url: string): { isValid: boolean; error?: string; sanitized: string } {
  const sanitized = sanitizeUrl(url)
  
  if (!url || url.trim().length === 0) {
    return { isValid: true, sanitized: '' } // Logo URL is optional
  }
  
  if (!sanitized) {
    return { isValid: false, error: 'Invalid URL format', sanitized: '' }
  }
  
  if (sanitized.length > 500) {
    return { isValid: false, error: 'URL must be less than 500 characters', sanitized }
  }
  
  // Check if URL points to an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
  const hasImageExtension = imageExtensions.some(ext => 
    sanitized.toLowerCase().includes(ext)
  )
  
  if (!hasImageExtension) {
    return { 
      isValid: false, 
      error: 'URL should point to an image file (.jpg, .png, .svg, etc.)', 
      sanitized 
    }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Real-time form validation for brand colors
 */
export function validateBrandColorsField(colors: string[]): { 
  isValid: boolean; 
  error?: string; 
  sanitized: string[] 
} {
  if (!Array.isArray(colors) || colors.length === 0) {
    return { 
      isValid: false, 
      error: 'At least one brand color is required', 
      sanitized: ['#3b82f6'] 
    }
  }
  
  if (colors.length > 5) {
    return { 
      isValid: false, 
      error: 'Maximum 5 brand colors allowed', 
      sanitized: colors.slice(0, 5).map(sanitizeHexColor) 
    }
  }
  
  const sanitized = colors.map(sanitizeHexColor)
  const invalidColors = colors.filter((color, index) => sanitized[index] === '#3b82f6' && color !== '#3b82f6')
  
  if (invalidColors.length > 0) {
    return { 
      isValid: false, 
      error: `Invalid color format: ${invalidColors.join(', ')}`, 
      sanitized 
    }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Comprehensive form validation
 */
export function validateClientForm(data: Partial<ClientFormData>): {
  isValid: boolean
  errors: ClientFormErrors
  sanitizedData: Partial<ClientFormData>
} {
  const errors: ClientFormErrors = {}
  const sanitizedData: Partial<ClientFormData> = {}
  
  // Validate name
  if (data.name !== undefined) {
    const nameValidation = validateClientNameField(data.name)
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error
    }
    sanitizedData.name = nameValidation.sanitized
  }
  
  // Validate email
  if (data.email !== undefined) {
    const emailValidation = validateEmailField(data.email)
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error
    }
    sanitizedData.email = emailValidation.sanitized || undefined
  }
  
  // Validate logo URL
  if (data.logoUrl !== undefined) {
    const urlValidation = validateLogoUrlField(data.logoUrl)
    if (!urlValidation.isValid) {
      errors.logoUrl = urlValidation.error
    }
    sanitizedData.logoUrl = urlValidation.sanitized || undefined
  }
  
  // Validate brand colors
  if (data.brandColors !== undefined) {
    const colorsValidation = validateBrandColorsField(data.brandColors)
    if (!colorsValidation.isValid) {
      errors.brandColors = colorsValidation.error
    }
    sanitizedData.brandColors = colorsValidation.sanitized
  }
  
  // Validate theme settings
  if (data.themeSettings !== undefined) {
    try {
      const sanitizedSettings = sanitizeClientSettings(data.themeSettings)
      sanitizedData.themeSettings = JSON.parse(sanitizedSettings)
    } catch (error) {
      errors.themeSettings = 'Invalid theme settings format'
    }
  }
  
  // Validate workspace settings
  if (data.workspaceSettings !== undefined) {
    try {
      const sanitizedSettings = sanitizeWorkspaceSettings(data.workspaceSettings)
      sanitizedData.workspaceSettings = JSON.parse(sanitizedSettings)
    } catch (error) {
      errors.workspaceSettings = 'Invalid workspace settings format'
    }
  }
  
  // Validate isActive
  if (data.isActive !== undefined) {
    if (typeof data.isActive !== 'boolean') {
      errors.isActive = 'Active status must be true or false'
    } else {
      sanitizedData.isActive = data.isActive
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  }
}

/**
 * Async validation for unique client name
 */
export async function validateUniqueClientName(
  name: string, 
  agencyId: string, 
  excludeClientId?: string
): Promise<{ isUnique: boolean; error?: string }> {
  try {
    const response = await fetch('/api/clients/validate-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, agencyId, excludeClientId })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return { isUnique: false, error: result.error || 'Validation failed' }
    }
    
    return { isUnique: result.isUnique, error: result.isUnique ? undefined : 'Client name already exists' }
  } catch (error) {
    return { isUnique: false, error: 'Unable to validate client name' }
  }
}

/**
 * Form field validation hooks for React components
 */
export function useClientFormValidation() {
  const [errors, setErrors] = React.useState<ClientFormErrors>({})
  const [isValidating, setIsValidating] = React.useState(false)
  
  const validateField = React.useCallback((field: keyof ClientFormData, value: any) => {
    let validation: { isValid: boolean; error?: string; sanitized?: any }
    
    switch (field) {
      case 'name':
        validation = validateClientNameField(value)
        break
      case 'email':
        validation = validateEmailField(value)
        break
      case 'logoUrl':
        validation = validateLogoUrlField(value)
        break
      case 'brandColors':
        validation = validateBrandColorsField(value)
        break
      default:
        validation = { isValid: true }
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: validation.error
    }))
    
    return validation
  }, [])
  
  const validateForm = React.useCallback((data: Partial<ClientFormData>) => {
    const validation = validateClientForm(data)
    setErrors(validation.errors)
    return validation
  }, [])
  
  const clearErrors = React.useCallback(() => {
    setErrors({})
  }, [])
  
  const clearFieldError = React.useCallback((field: keyof ClientFormData) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])
  
  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    setIsValidating
  }
}

/**
 * Debounced validation for real-time form feedback
 */
export function useDebouncedValidation<T>(
  value: T,
  validator: (value: T) => { isValid: boolean; error?: string; sanitized?: any },
  delay: number = 300
) {
  const [validation, setValidation] = React.useState<{ 
    isValid: boolean; 
    error?: string; 
    sanitized?: any 
  }>({ isValid: true })
  const [isValidating, setIsValidating] = React.useState(false)
  
  React.useEffect(() => {
    setIsValidating(true)
    
    const timer = setTimeout(() => {
      const result = validator(value)
      setValidation(result)
      setIsValidating(false)
    }, delay)
    
    return () => {
      clearTimeout(timer)
      setIsValidating(false)
    }
  }, [value, validator, delay])
  
  return { ...validation, isValidating }
}

/**
 * Form submission validation
 */
export function validateClientFormForSubmission(data: ClientFormData): {
  isValid: boolean
  errors: ClientFormErrors
  sanitizedData: ClientFormData
} {
  const validation = validateClientForm(data)
  
  // Additional submission-specific validations
  if (!validation.sanitizedData.name) {
    validation.errors.name = 'Client name is required'
    validation.isValid = false
  }
  
  if (!validation.sanitizedData.brandColors || validation.sanitizedData.brandColors.length === 0) {
    validation.errors.brandColors = 'At least one brand color is required'
    validation.isValid = false
  }
  
  // Ensure required fields have values
  const sanitizedData: ClientFormData = {
    name: validation.sanitizedData.name || '',
    email: validation.sanitizedData.email,
    logoUrl: validation.sanitizedData.logoUrl,
    brandColors: validation.sanitizedData.brandColors || ['#3b82f6'],
    themeSettings: validation.sanitizedData.themeSettings,
    workspaceSettings: validation.sanitizedData.workspaceSettings,
    isActive: validation.sanitizedData.isActive ?? true
  }
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    sanitizedData
  }
}

