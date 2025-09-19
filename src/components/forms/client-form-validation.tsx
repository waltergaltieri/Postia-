'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import {
  validateClientNameField,
  validateEmailField,
  validateLogoUrlField,
  validateBrandColorsField,
  validateClientForm,
  validateUniqueClientName,
  type ClientFormData,
  type ClientFormErrors
} from '@/lib/validation/client-form-validation'

/**
 * Form field validation component
 */
interface FormFieldValidationProps {
  error?: string
  isValidating?: boolean
  isValid?: boolean
  showSuccess?: boolean
  children: React.ReactNode
}

export function FormFieldValidation({
  error,
  isValidating,
  isValid,
  showSuccess = false,
  children
}: FormFieldValidationProps) {
  return (
    <div className="space-y-2">
      {children}

      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Validating...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showSuccess && isValid && !error && !isValidating && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          Valid
        </div>
      )}
    </div>
  )
}

/**
 * Client name validation input component
 */
interface ClientNameInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  agencyId?: string
  excludeClientId?: string
  showSuccess?: boolean
  className?: string
  id?: string
}

export function ClientNameInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter client name",
  required = true,
  agencyId,
  excludeClientId,
  showSuccess = false,
  className = "",
  id = "client-name-input"
}: ClientNameInputProps) {
  const [error, setError] = useState<string>()
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [uniqueNameTimer, setUniqueNameTimer] = useState<NodeJS.Timeout>()

  const validateName = useCallback(async (name: string) => {
    // Basic validation
    const basicValidation = validateClientNameField(name)

    if (!basicValidation.isValid) {
      setError(basicValidation.error)
      setIsValid(false)
      onChange(basicValidation.sanitized, false)
      return
    }

    // Unique name validation (if agencyId provided)
    if (agencyId && name.trim().length > 0) {
      setIsValidating(true)

      try {
        const uniqueValidation = await validateUniqueClientName(name, agencyId, excludeClientId)

        if (!uniqueValidation.isUnique) {
          setError(uniqueValidation.error)
          setIsValid(false)
          onChange(basicValidation.sanitized, false)
        } else {
          setError(undefined)
          setIsValid(true)
          onChange(basicValidation.sanitized, true)
        }
      } catch (error) {
        setError('Unable to validate client name')
        setIsValid(false)
        onChange(basicValidation.sanitized, false)
      } finally {
        setIsValidating(false)
      }
    } else {
      setError(undefined)
      setIsValid(true)
      onChange(basicValidation.sanitized, true)
    }
  }, [agencyId, excludeClientId, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Clear previous timer
    if (uniqueNameTimer) {
      clearTimeout(uniqueNameTimer)
    }

    // Immediate basic validation
    const basicValidation = validateClientNameField(newValue)
    onChange(basicValidation.sanitized, basicValidation.isValid)

    if (!basicValidation.isValid) {
      setError(basicValidation.error)
      setIsValid(false)
      return
    }

    // Debounced unique name validation
    if (agencyId && newValue.trim().length > 0) {
      const timer = setTimeout(() => {
        validateName(newValue)
      }, 500)
      setUniqueNameTimer(timer)
    } else {
      setError(undefined)
      setIsValid(basicValidation.isValid)
    }
  }

  useEffect(() => {
    return () => {
      if (uniqueNameTimer) {
        clearTimeout(uniqueNameTimer)
      }
    }
  }, [uniqueNameTimer])

  return (
    <FormFieldValidation
      error={error}
      isValidating={isValidating}
      isValid={isValid}
      showSuccess={showSuccess}
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        title="Enter client name"
        aria-label="Client name"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : isValid ? 'border-green-500' : 'border-gray-300'
          } ${className}`}
      />
    </FormFieldValidation>
  )
}

/**
 * Email validation input component
 */
interface EmailInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  onBlur?: () => void
  placeholder?: string
  showSuccess?: boolean
  className?: string
  id?: string
}

export function EmailInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter email address",
  showSuccess = false,
  className = ""
}: EmailInputProps) {
  const [error, setError] = useState<string>()
  const [isValid, setIsValid] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const validation = validateEmailField(newValue)

    setError(validation.error)
    setIsValid(validation.isValid)
    onChange(validation.sanitized, validation.isValid)
  }

  return (
    <FormFieldValidation
      error={error}
      isValid={isValid}
      showSuccess={showSuccess}
    >
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        title="Enter email address"
        aria-label="Email address"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : isValid && value ? 'border-green-500' : 'border-gray-300'
          } ${className}`}
      />
    </FormFieldValidation>
  )
}

/**
 * Logo URL validation input component
 */
interface LogoUrlInputProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  onBlur?: () => void
  placeholder?: string
  showSuccess?: boolean
  className?: string
}

export function LogoUrlInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter logo URL",
  showSuccess = false,
  className = ""
}: LogoUrlInputProps) {
  const [error, setError] = useState<string>()
  const [isValid, setIsValid] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const validation = validateLogoUrlField(newValue)

    setError(validation.error)
    setIsValid(validation.isValid)
    onChange(validation.sanitized, validation.isValid)
  }

  return (
    <FormFieldValidation
      error={error}
      isValid={isValid}
      showSuccess={showSuccess}
    >
      <input
        type="url"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        title="Enter logo URL"
        aria-label="Logo URL"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : isValid && value ? 'border-green-500' : 'border-gray-300'
          } ${className}`}
      />
    </FormFieldValidation>
  )
}

/**
 * Brand colors validation component
 */
interface BrandColorsInputProps {
  value: string[]
  onChange: (value: string[], isValid: boolean) => void
  maxColors?: number
  showSuccess?: boolean
}

export function BrandColorsInput({
  value,
  onChange,
  maxColors = 5,
  showSuccess = false
}: BrandColorsInputProps) {
  const [error, setError] = useState<string>()
  const [isValid, setIsValid] = useState(true)

  const validateColors = useCallback((colors: string[]) => {
    const validation = validateBrandColorsField(colors)
    setError(validation.error)
    setIsValid(validation.isValid)
    onChange(validation.sanitized, validation.isValid)
  }, [onChange])

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...value]
    newColors[index] = newColor
    validateColors(newColors)
  }

  const addColor = () => {
    if (value.length < maxColors) {
      validateColors([...value, '#3b82f6'])
    }
  }

  const removeColor = (index: number) => {
    if (value.length > 1) {
      const newColors = value.filter((_, i) => i !== index)
      validateColors(newColors)
    }
  }

  return (
    <FormFieldValidation
      error={error}
      isValid={isValid}
      showSuccess={showSuccess}
    >
      <div className="space-y-3">
        {value.map((color, index) => (
          <div key={index} className="flex items-center gap-3">
            <label htmlFor={`color-picker-${index}`} className="sr-only">
              Brand color {index + 1} picker
            </label>
            <input
              id={`color-picker-${index}`}
              type="color"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              title={`Brand color ${index + 1} picker`}
              aria-label={`Brand color ${index + 1} picker`}
              className="w-12 h-10 border rounded cursor-pointer"
            />
            <label htmlFor={`color-input-${index}`} className="sr-only">
              Brand color {index + 1} hex value
            </label>
            <input
              id={`color-input-${index}`}
              type="text"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              placeholder="#000000"
              title={`Brand color ${index + 1} hex value`}
              aria-label={`Brand color ${index + 1} hex value`}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => removeColor(index)}
                title={`Remove brand color ${index + 1}`}
                aria-label={`Remove brand color ${index + 1}`}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {value.length < maxColors && (
          <button
            type="button"
            onClick={addColor}
            title="Add another brand color"
            aria-label="Add another brand color"
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
          >
            Add Color
          </button>
        )}
      </div>
    </FormFieldValidation>
  )
}

/**
 * Complete client form validation component
 */
interface ClientFormValidationProps {
  data: Partial<ClientFormData>
  onChange: (data: Partial<ClientFormData>, isValid: boolean) => void
  agencyId?: string
  excludeClientId?: string
  showFieldSuccess?: boolean
}

export function ClientFormValidation({
  data,
  onChange,
  agencyId,
  excludeClientId,
  showFieldSuccess = false
}: ClientFormValidationProps) {
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const validateForm = useCallback(() => {
    const validation = validateClientForm(data)
    setFormErrors(validation.errors)
    setIsFormValid(validation.isValid)
    return validation
  }, [data])

  useEffect(() => {
    const validation = validateForm()
    onChange(validation.sanitizedData, validation.isValid)
  }, [data, validateForm, onChange])

  const handleFieldChange = (field: keyof ClientFormData, value: any, fieldIsValid: boolean) => {
    const newData = { ...data, [field]: value }
    onChange(newData, false) // Will be validated in useEffect
  }

  return (
    <div className="space-y-6">
      {/* Client Name */}
      <div>
        <label htmlFor="client-name-input" className="block text-sm font-medium text-gray-700 mb-2">
          Client Name *
        </label>
        <ClientNameInput
          value={data.name || ''}
          onChange={(value, isValid) => handleFieldChange('name', value, isValid)}
          agencyId={agencyId}
          excludeClientId={excludeClientId}
          showSuccess={showFieldSuccess}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="client-email-input" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <EmailInput
          value={data.email || ''}
          onChange={(value, isValid) => handleFieldChange('email', value, isValid)}
          showSuccess={showFieldSuccess}
        />
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="client-logo-input" className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <LogoUrlInput
          value={data.logoUrl || ''}
          onChange={(value, isValid) => handleFieldChange('logoUrl', value, isValid)}
          showSuccess={showFieldSuccess}
        />
      </div>

      {/* Brand Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand Colors *
        </label>
        <BrandColorsInput
          value={data.brandColors || ['#3b82f6']}
          onChange={(value, isValid) => handleFieldChange('brandColors', value, isValid)}
          showSuccess={showFieldSuccess}
        />
      </div>

      {/* Form-level validation summary */}
      {Object.keys(formErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="mt-2 list-disc list-inside">
              {Object.entries(formErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success indicator */}
      {isFormValid && Object.keys(formErrors).length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Form is valid and ready to submit.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}