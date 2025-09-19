"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { AnimatePresence } from "framer-motion"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ConfirmationModal,
  type ModalSize,
  type ModalType
} from "./modal"
import {
  QuickAlert,
  type AlertType
} from "./alert-dialog"

// Modal configuration types
interface BaseModalConfig {
  id: string
  title: string
  description?: string
  size?: ModalSize
  type?: ModalType
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

interface CustomModalConfig extends BaseModalConfig {
  variant: "custom"
  content: ReactNode
  footer?: ReactNode
}

interface ConfirmationModalConfig extends BaseModalConfig {
  variant: "confirmation"
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

interface AlertModalConfig {
  id: string
  variant: "alert"
  type: AlertType
  title: string
  description: string
  actionText?: string
  cancelText?: string
  onAction?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

interface FormModalConfig extends BaseModalConfig {
  variant: "form"
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  submitText?: string
  cancelText?: string
  loading?: boolean
}

interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "textarea" | "select" | "checkbox"
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: (value: any) => string | undefined
}

type ModalConfig = CustomModalConfig | ConfirmationModalConfig | AlertModalConfig | FormModalConfig

// Modal manager context
interface ModalManagerContextType {
  openModal: (config: ModalConfig) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  updateModal: (id: string, updates: Partial<Omit<ModalConfig, 'variant' | 'id'>>) => void
  isModalOpen: (id: string) => boolean
  getModalData: (id: string) => any
}

const ModalManagerContext = createContext<ModalManagerContextType | null>(null)

// Modal manager provider
interface ModalManagerProviderProps {
  children: ReactNode
  maxModals?: number
}

export function ModalManagerProvider({
  children,
  maxModals = 5
}: ModalManagerProviderProps) {
  const [modals, setModals] = useState<Map<string, ModalConfig & { open: boolean; data?: any }>>(new Map())

  const openModal = useCallback((config: ModalConfig) => {
    setModals(prev => {
      const newModals = new Map(prev)

      // Close oldest modal if we exceed the limit
      if (newModals.size >= maxModals) {
        const oldestId = Array.from(newModals.keys())[0]
        newModals.delete(oldestId)
      }

      newModals.set(config.id, { ...config, open: true })
      return newModals
    })
  }, [maxModals])

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const newModals = new Map(prev)
      const modal = newModals.get(id)
      if (modal) {
        newModals.set(id, { ...modal, open: false })
        // Remove after animation completes
        setTimeout(() => {
          setModals(current => {
            const updated = new Map(current)
            updated.delete(id)
            return updated
          })
        }, 300)
      }
      return newModals
    })
  }, [])

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = new Map()
      prev.forEach((modal, id) => {
        newModals.set(id, { ...modal, open: false })
      })

      // Remove all after animation completes
      setTimeout(() => {
        setModals(new Map())
      }, 300)

      return newModals
    })
  }, [])

  const updateModal = useCallback((id: string, updates: Partial<Omit<ModalConfig, 'variant' | 'id'>>) => {
    setModals(prev => {
      const newModals = new Map(prev)
      const modal = newModals.get(id)
      if (modal) {
        newModals.set(id, { ...modal, ...updates } as typeof modal)
      }
      return newModals
    })
  }, [])

  const isModalOpen = useCallback((id: string) => {
    return modals.get(id)?.open ?? false
  }, [modals])

  const getModalData = useCallback((id: string) => {
    return modals.get(id)?.data
  }, [modals])

  const contextValue: ModalManagerContextType = {
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
    isModalOpen,
    getModalData
  }

  return (
    <ModalManagerContext.Provider value={contextValue}>
      {children}
      <ModalRenderer modals={modals} onClose={closeModal} />
    </ModalManagerContext.Provider>
  )
}

// Modal renderer component
interface ModalRendererProps {
  modals: Map<string, ModalConfig & { open: boolean; data?: any }>
  onClose: (id: string) => void
}

function ModalRenderer({ modals, onClose }: ModalRendererProps) {
  return (
    <AnimatePresence>
      {Array.from(modals.entries()).map(([id, modal]) => {
        if (!modal.open) return null

        switch (modal.variant) {
          case "custom":
            return (
              <Modal key={id} open={modal.open} onOpenChange={(open) => !open && onClose(id)}>
                <ModalContent
                  size={modal.size}
                  type={modal.type}
                  showCloseButton={modal.showCloseButton}
                >
                  <ModalHeader>
                    <ModalTitle>{modal.title}</ModalTitle>
                    {modal.description && (
                      <ModalDescription>{modal.description}</ModalDescription>
                    )}
                  </ModalHeader>
                  <ModalBody>
                    {modal.content}
                  </ModalBody>
                  {modal.footer && (
                    <ModalFooter>
                      {modal.footer}
                    </ModalFooter>
                  )}
                </ModalContent>
              </Modal>
            )

          case "confirmation":
            return (
              <ConfirmationModal
                key={id}
                open={modal.open}
                onOpenChange={(open) => !open && onClose(id)}
                title={modal.title}
                description={modal.description || ""}
                confirmText={modal.confirmText}
                cancelText={modal.cancelText}
                type={modal.type === "destructive" ? "destructive" : "info"}
                loading={modal.loading}
                onConfirm={modal.onConfirm}
                onCancel={modal.onCancel || (() => onClose(id))}
              />
            )

          case "alert":
            return (
              <QuickAlert
                key={id}
                open={modal.open}
                onOpenChange={(open) => !open && onClose(id)}
                type={modal.type}
                title={modal.title}
                description={modal.description}
                actionText={modal.actionText}
                cancelText={modal.cancelText}
                loading={modal.loading}
                onAction={modal.onAction || (() => onClose(id))}
                onCancel={modal.onCancel || (() => onClose(id))}
              />
            )

          case "form":
            return (
              <FormModal
                key={id}
                modal={modal}
                onClose={() => onClose(id)}
              />
            )

          default:
            return null
        }
      })}
    </AnimatePresence>
  )
}

// Form modal component
interface FormModalProps {
  modal: FormModalConfig & { open: boolean }
  onClose: () => void
}

function FormModal({ modal, onClose }: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: Record<string, string> = {}
    modal.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`
      } else if (field.validation) {
        const error = field.validation(formData[field.name])
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await modal.onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  return (
    <Modal open={modal.open} onOpenChange={(open) => !open && onClose()}>
      <ModalContent size={modal.size} type={modal.type}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>{modal.title}</ModalTitle>
            {modal.description && (
              <ModalDescription>{modal.description}</ModalDescription>
            )}
          </ModalHeader>

          <ModalBody className="space-y-4">
            {modal.fields.map(field => (
              <div key={field.name} className="space-y-2">
                <label htmlFor={`field-${field.name}`} className="text-sm font-medium text-neutral-700">
                  {field.label}
                  {field.required && <span className="text-error-500 ml-1">*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.name}`}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    rows={3}
                    aria-describedby={errors[field.name] ? `error-${field.name}` : undefined}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`field-${field.name}`}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    aria-describedby={errors[field.name] ? `error-${field.name}` : undefined}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center space-x-2">
                    <input
                      id={`field-${field.name}`}
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="rounded border-neutral-300 focus:ring-2 focus:ring-primary-500"
                      aria-describedby={errors[field.name] ? `error-${field.name}` : undefined}
                    />
                    <span className="text-sm text-neutral-600">{field.placeholder}</span>
                  </label>
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    aria-describedby={errors[field.name] ? `error-${field.name}` : undefined}
                  />
                )}

                {errors[field.name] && (
                  <p id={`error-${field.name}`} className="text-sm text-error-600">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {modal.cancelText || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? "Loading..." : (modal.submitText || "Submit")}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

// Hook to use modal manager
export function useModalManager() {
  const context = useContext(ModalManagerContext)
  if (!context) {
    throw new Error("useModalManager must be used within a ModalManagerProvider")
  }
  return context
}

// Convenience hooks for specific modal types
export function useConfirmationDialog() {
  const { openModal, closeModal } = useModalManager()

  return useCallback((config: Omit<ConfirmationModalConfig, "variant" | "id">) => {
    const id = `confirmation-${Date.now()}`
    return new Promise<boolean>((resolve) => {
      openModal({
        ...config,
        id,
        variant: "confirmation",
        onConfirm: async () => {
          if (config.onConfirm) {
            await config.onConfirm()
          }
          closeModal(id)
          resolve(true)
        },
        onCancel: () => {
          if (config.onCancel) {
            config.onCancel()
          }
          closeModal(id)
          resolve(false)
        }
      })
    })
  }, [openModal, closeModal])
}

export function useAlertDialog() {
  const { openModal, closeModal } = useModalManager()

  return useCallback((config: Omit<AlertModalConfig, "variant" | "id">) => {
    const id = `alert-${Date.now()}`
    openModal({
      ...config,
      id,
      variant: "alert",
      onAction: async () => {
        if (config.onAction) {
          await config.onAction()
        }
        closeModal(id)
      },
      onCancel: () => {
        if (config.onCancel) {
          config.onCancel()
        }
        closeModal(id)
      }
    })
  }, [openModal, closeModal])
}

export type {
  ModalConfig,
  CustomModalConfig,
  ConfirmationModalConfig,
  AlertModalConfig,
  FormModalConfig,
  FormField
}