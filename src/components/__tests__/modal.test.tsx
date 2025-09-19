import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalTrigger,
  ConfirmationModal,
  ResponsiveModal
} from '../ui/modal'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
  QuickAlert
} from '../ui/alert-dialog'
import { Button } from '../ui/button'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('Modal Components', () => {
  describe('Basic Modal', () => {
    it('renders modal with trigger', () => {
      render(
        <Modal>
          <ModalTrigger asChild>
            <Button> <span>Open Modal</span></Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
              <ModalDescription>This is a test modal</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <p>Modal content</p>
            </ModalBody>
          </ModalContent>
        </Modal>
      )

      expect(screen.getByText('Open Modal')).toBeInTheDocument()
    })

    it('opens modal when trigger is clicked', async () => {
      render(
        <Modal>
          <ModalTrigger asChild>
            <Button> <span>Open Modal</span></Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      )

      fireEvent.click(screen.getByText('Open Modal'))
      
      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument()
      })
    })

    it('closes modal when close button is clicked', async () => {
      render(
        <Modal defaultOpen>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Test Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </Modal>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Modal Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const

    sizes.forEach(size => {
      it(`renders ${size} modal with correct size class`, () => {
        render(
          <Modal defaultOpen>
            <ModalContent size={size}>
              <ModalHeader>
                <ModalTitle>Size Test</ModalTitle>
              </ModalHeader>
            </ModalContent>
          </Modal>
        )

        const modal = screen.getByRole('dialog')
        expect(modal).toHaveClass(`max-w-${size === 'full' ? '[95vw]' : size}`)
      })
    })
  })

  describe('Modal Types', () => {
    const types = ['default', 'confirmation', 'destructive', 'success', 'info', 'warning'] as const

    types.forEach(type => {
      it(`renders ${type} modal with correct styling`, () => {
        render(
          <Modal defaultOpen>
            <ModalContent type={type}>
              <ModalHeader type={type}>
                <ModalTitle>Type Test</ModalTitle>
              </ModalHeader>
            </ModalContent>
          </Modal>
        )

        if (type !== 'default') {
          // Check for icon presence
          const icon = screen.getByRole('dialog').querySelector('svg')
          expect(icon).toBeInTheDocument()
        }
      })
    })
  })

  describe('ConfirmationModal', () => {
    it('renders confirmation modal with correct props', () => {
      const onConfirm = jest.fn()
      const onCancel = jest.fn()

      render(
        <ConfirmationModal
          open={true}
          onOpenChange={() => {}}
          title="Confirm Action"
          description="Are you sure?"
          confirmText="Yes"
          cancelText="No"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )

      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn()

      render(
        <ConfirmationModal
          open={true}
          onOpenChange={() => <span>{}}
          title="Confirm Action"
          description="Are you sure?"
          onConfirm={onConfirm}
        />
      )

      fireEvent.click(screen.getByText('Confirm'))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('shows loading state', () => {
      render(</span><ConfirmationModal
          open={true}
          onOpenChange={() => {}}
          title="Confirm Action"
          description="Are you sure?"
          onConfirm={() => {}}
          loading={true}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('ResponsiveModal', () => {
    it('renders responsive modal', () => {
      render(
        <ResponsiveModal open={true} onOpenChange={() => {}}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Responsive Modal</ModalTitle>
            </ModalHeader>
          </ModalContent>
        </ResponsiveModal>
      )

      expect(screen.getByText('Responsive Modal')).toBeInTheDocument()
    })
  })
})

describe('Alert Dialog Components', () => {
  describe('Basic AlertDialog', () => {
    it('renders alert dialog with trigger', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button> <span>Open Alert</span></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alert Title</AlertDialogTitle>
              <AlertDialogDescription>Alert description</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Open Alert')).toBeInTheDocument()
    })
  })

  describe('Alert Types', () => {
    const alertTypes = ['info', 'success', 'warning', 'error'] as const

    alertTypes.forEach(type => {
      it(`renders ${type} alert with correct styling`, () => {
        render(
          <AlertDialog defaultOpen>
            <AlertDialogContent type={type}>
              <AlertDialogHeader type={type}>
                <AlertDialogTitle>Alert Test</AlertDialogTitle>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        )

        // Check for icon presence
        const icon = screen.getByRole('alertdialog').querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('QuickAlert', () => {
    it('renders quick alert with correct props', () => {
      const onAction = jest.fn()

      render(
        <QuickAlert
          open={true}
          onOpenChange={() => {}}
          type="info"
          title="Information"
          description="This is an info alert"
          actionText="Got it"
          onAction={onAction}
        />
      )

      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText('This is an info alert')).toBeInTheDocument()
      expect(screen.getByText('Got it')).toBeInTheDocument()
    })

    it('calls onAction when action button is clicked', () => {
      const onAction = jest.fn()

      render(
        <QuickAlert
          open={true}
          onOpenChange={() => <span>{}}
          type="info"
          title="Information"
          description="This is an info alert"
          onAction={onAction}
        />
      )

      fireEvent.click(screen.getByText('OK'))
      expect(onAction).toHaveBeenCalled()
    })

    it('shows loading state', () => {
      render(</span><QuickAlert
          open={true}
          onOpenChange={() => {}}
          type="info"
          title="Information"
          description="This is an info alert"
          loading={true}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})

describe('Accessibility', () => {
  it('modal has correct ARIA attributes', () => {
    render(
      <Modal defaultOpen>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Accessible Modal</ModalTitle>
            <ModalDescription>This modal is accessible</ModalDescription>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-labelledby')
    expect(modal).toHaveAttribute('aria-describedby')
  })

  it('alert dialog has correct ARIA attributes', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accessible Alert</AlertDialogTitle>
            <AlertDialogDescription>This alert is accessible</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    )

    const alert = screen.getByRole('alertdialog')
    expect(alert).toHaveAttribute('aria-labelledby')
    expect(alert).toHaveAttribute('aria-describedby')
  })

  it('close button has screen reader text', () => {
    render(
      <Modal defaultOpen>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Modal with Close</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    expect(screen.getByText('Close')).toHaveClass('sr-only')
  })
})

describe('Keyboard Navigation', () => {
  it('closes modal on Escape key', async () => {
    const onOpenChange = jest.fn()

    render(
      <Modal open={true} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Keyboard Test</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})