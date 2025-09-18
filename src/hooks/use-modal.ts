"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseModalOptions {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
}

interface ModalState {
  open: boolean
  data?: any
  loading: boolean
}

interface UseModalReturn {
  // State
  open: boolean
  data: any
  loading: boolean
  
  // Actions
  openModal: (data?: any) => void
  closeModal: () => void
  toggleModal: () => void
  setLoading: (loading: boolean) => void
  setData: (data: any) => void
  
  // Handlers
  onOpenChange: (open: boolean) => void
}

/**
 * Hook for managing modal state with additional features
 */
export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const {
    defaultOpen = false,
    onOpenChange: externalOnOpenChange,
    closeOnEscape = true,
    closeOnOverlayClick = true
  } = options

  const [state, setState] = useState<ModalState>({
    open: defaultOpen,
    data: undefined,
    loading: false
  })

  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !state.open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [state.open, closeOnEscape])

  // Focus management
  useEffect(() => {
    if (state.open) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [state.open])

  const openModal = useCallback((data?: any) => {
    setState(prev => ({
      ...prev,
      open: true,
      data,
      loading: false
    }))
  }, [])

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      open: false,
      loading: false
    }))
  }, [])

  const toggleModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      open: !prev.open,
      loading: false
    }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading
    }))
  }, [])

  const setData = useCallback((data: any) => {
    setState(prev => ({
      ...prev,
      data
    }))
  }, [])

  const onOpenChange = useCallback((open: boolean) => {
    setState(prev => ({
      ...prev,
      open,
      loading: false
    }))
    
    if (externalOnOpenChange) {
      externalOnOpenChange(open)
    }
  }, [externalOnOpenChange])

  return {
    // State
    open: state.open,
    data: state.data,
    loading: state.loading,
    
    // Actions
    openModal,
    closeModal,
    toggleModal,
    setLoading,
    setData,
    
    // Handlers
    onOpenChange
  }
}

/**
 * Hook for managing multiple modals with a registry system
 */
interface UseModalRegistryReturn {
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  isModalOpen: (id: string) => boolean
  getModalData: (id: string) => any
  setModalLoading: (id: string, loading: boolean) => void
  getModalState: (id: string) => ModalState | undefined
}

export function useModalRegistry(): UseModalRegistryReturn {
  const [modals, setModals] = useState<Record<string, ModalState>>({})

  const openModal = useCallback((id: string, data?: any) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        open: true,
        data,
        loading: false
      }
    }))
  }, [])

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        open: false,
        loading: false
      }
    }))
  }, [])

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(id => {
        updated[id] = {
          ...updated[id],
          open: false,
          loading: false
        }
      })
      return updated
    })
  }, [])

  const isModalOpen = useCallback((id: string) => {
    return modals[id]?.open ?? false
  }, [modals])

  const getModalData = useCallback((id: string) => {
    return modals[id]?.data
  }, [modals])

  const setModalLoading = useCallback((id: string, loading: boolean) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        loading
      }
    }))
  }, [])

  const getModalState = useCallback((id: string) => {
    return modals[id]
  }, [modals])

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
    setModalLoading,
    getModalState
  }
}

/**
 * Hook for confirmation dialogs with promise-based API
 */
interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  type?: "info" | "warning" | "destructive"
}

interface UseConfirmationReturn {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
  ConfirmationDialog: React.ComponentType
}

export function useConfirmation(): UseConfirmationReturn {
  const [confirmationState, setConfirmationState] = useState<{
    open: boolean
    options: ConfirmationOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    options: null,
    resolve: null
  })

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        open: true,
        options,
        resolve
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmationState.resolve) {
      confirmationState.resolve(true)
    }
    setConfirmationState({
      open: false,
      options: null,
      resolve: null
    })
  }, [confirmationState.resolve])

  const handleCancel = useCallback(() => {
    if (confirmationState.resolve) {
      confirmationState.resolve(false)
    }
    setConfirmationState({
      open: false,
      options: null,
      resolve: null
    })
  }, [confirmationState.resolve])

  const ConfirmationDialog = useCallback(() => {
    // This would need to be implemented with the actual ConfirmationModal component
    // For now, returning a placeholder
    return null
  }, [])

  return {
    confirm,
    ConfirmationDialog
  }
}

/**
 * Hook for managing modal animations and transitions
 */
interface UseModalAnimationOptions {
  duration?: number
  easing?: string
  stagger?: number
}

interface UseModalAnimationReturn {
  variants: {
    backdrop: any
    content: any
  }
  transition: any
}

export function useModalAnimation(options: UseModalAnimationOptions = {}): UseModalAnimationReturn {
  const {
    duration = 0.2,
    easing = "easeOut",
    stagger = 0.05
  } = options

  const variants = {
    backdrop: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration, ease: easing }
      },
      exit: { 
        opacity: 0,
        transition: { duration: duration * 0.75, ease: "easeIn" }
      }
    },
    content: {
      hidden: { 
        opacity: 0, 
        scale: 0.95,
        y: -20
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        y: 0,
        transition: { 
          duration, 
          ease: easing,
          delay: stagger,
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.95,
        y: -10,
        transition: { duration: duration * 0.75, ease: "easeIn" }
      }
    }
  }

  const transition = {
    duration,
    ease: easing
  }

  return {
    variants,
    transition
  }
}