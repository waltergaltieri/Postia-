'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import TouchFeedback from './touch-feedback'
import { useMobile } from '@/hooks/use-mobile'
import { useState } from 'react'

// Mobile-optimized Input
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  showPasswordToggle?: boolean
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, hint, icon: Icon, showPasswordToggle, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isMobile = useMobile()
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password') 
      : type

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(
            "text-sm font-medium",
            isMobile && "text-base"
          )}>
            {label}
          </Label>
        )}
        
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              "mobile-form-input",
              Icon && "pl-10",
              showPasswordToggle && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          
          {showPasswordToggle && (
            <TouchFeedback
              onTap={() => setShowPassword(!showPassword)}
              hapticFeedback={isMobile}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Eye className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
            </TouchFeedback>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'

// Mobile-optimized Textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  autoResize?: boolean
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ label, error, hint, autoResize = true, className, ...props }, ref) => {
    const isMobile = useMobile()

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(
            "text-sm font-medium",
            isMobile && "text-base"
          )}>
            {label}
          </Label>
        )}
        
        <Textarea
          ref={ref}
          className={cn(
            "mobile-form-input resize-none",
            autoResize && "min-h-[100px]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

MobileTextarea.displayName = 'MobileTextarea'

// Mobile-optimized Select
interface MobileSelectProps {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function MobileSelect({
  label,
  error,
  hint,
  placeholder = "Seleccionar...",
  options,
  value,
  onValueChange,
  className
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useMobile()
  
  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          "text-sm font-medium",
          isMobile && "text-base"
        )}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <TouchFeedback
          onTap={() => setIsOpen(!isOpen)}
          hapticFeedback={isMobile}
        >
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between mobile-form-input",
              error && "border-red-500",
              className
            )}
          >
            <span className={cn(
              !selectedOption && "text-muted-foreground"
            )}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </TouchFeedback>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <TouchFeedback
                key={option.value}
                onTap={() => {
                  onValueChange?.(option.value)
                  setIsOpen(false)
                }}
                hapticFeedback={isMobile}
              >
                <div className={cn(
                  "px-3 py-3 hover:bg-accent cursor-pointer",
                  "border-b border-border last:border-b-0",
                  "touch-target",
                  value === option.value && "bg-accent text-accent-foreground"
                )}>
                  {option.label}
                </div>
              </TouchFeedback>
            ))}
          </motion.div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

// Mobile-optimized Form Container
interface MobileFormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

export function MobileForm({ children, onSubmit, className }: MobileFormProps) {
  const isMobile = useMobile()

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "space-y-6",
        isMobile && "space-y-4",
        className
      )}
    >
      {children}
    </form>
  )
}

// Mobile-optimized Form Actions
interface MobileFormActionsProps {
  children: React.ReactNode
  className?: string
}

export function MobileFormActions({ children, className }: MobileFormActionsProps) {
  const isMobile = useMobile()

  return (
    <div className={cn(
      "flex gap-3 pt-4",
      isMobile && "flex-col gap-3 pt-6",
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-optimized Submit Button
interface MobileSubmitButtonProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  className?: string
}

export function MobileSubmitButton({
  children,
  loading = false,
  disabled = false,
  variant = 'default',
  className
}: MobileSubmitButtonProps) {
  const isMobile = useMobile()

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={disabled || loading}
      className={cn(
        isMobile && "w-full touch-target-large",
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </Button>
  )
}