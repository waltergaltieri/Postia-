"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
  ConfirmationModal,
  ResponsiveModal,
  type ModalSize,
  type ModalType
} from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
  QuickAlert,
  type AlertType
} from "@/components/ui/alert-dialog"
import { useModal } from "@/hooks/use-modal"

export default function ModalDemoPage() {
  const [basicModalOpen, setBasicModalOpen] = useState(false)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [destructiveModalOpen, setDestructiveModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [responsiveModalOpen, setResponsiveModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Alert dialog states
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [quickAlertOpen, setQuickAlertOpen] = useState(false)
  const [quickAlertType, setQuickAlertType] = useState<AlertType>("info")
  
  // Using the modal hook
  const deleteModal = useModal({
    closeOnEscape: true,
    closeOnOverlayClick: false
  })

  const handleDestructiveAction = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    setDestructiveModalOpen(false)
  }

  const modalSizes: ModalSize[] = ["sm", "md", "lg", "xl", "2xl", "full"]
  const modalTypes: ModalType[] = ["default", "confirmation", "destructive", "success", "info", "warning"]
  const alertTypes: AlertType[] = ["info", "success", "warning", "error"]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Premium Modals & Dialogs</h1>
        <p className="text-neutral-600">
          Elegant modal components with backdrop blur, smooth animations, and responsive design.
        </p>
      </div>

      {/* Basic Modal Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Modal Examples</CardTitle>
          <CardDescription>
            Standard modals with different sizes and types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {modalSizes.map((size) => (
              <Modal key={size}>
                <ModalTrigger asChild>
                  <Button variant="outline" size="sm">
                    {size.toUpperCase()}
                  </Button>
                </ModalTrigger>
                <ModalContent size={size}>
                  <ModalHeader>
                    <ModalTitle>Modal Size: {size}</ModalTitle>
                    <ModalDescription>
                      This is a {size} sized modal demonstrating the responsive sizing system.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalBody>
                    <p className="text-sm text-neutral-600">
                      Modal content goes here. This modal uses the {size} size variant
                      and demonstrates the backdrop blur effect and smooth animations.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Types */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Types</CardTitle>
          <CardDescription>
            Different modal types with contextual icons and styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {modalTypes.map((type) => (
              <Modal key={type}>
                <ModalTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={
                      type === "destructive" ? "border-error-300 text-error-700 hover:bg-error-50" :
                      type === "success" ? "border-success-300 text-success-700 hover:bg-success-50" :
                      type === "warning" ? "border-warning-300 text-warning-700 hover:bg-warning-50" :
                      type === "info" ? "border-info-300 text-info-700 hover:bg-info-50" :
                      ""
                    }
                  >
                    {type}
                  </Button>
                </ModalTrigger>
                <ModalContent type={type}>
                  <ModalHeader type={type}>
                    <ModalTitle>{type.charAt(0).toUpperCase() + type.slice(1)} Modal</ModalTitle>
                    <ModalDescription>
                      This is a {type} modal with contextual styling and iconography.
                    </ModalDescription>
                  </ModalHeader>
                  <ModalBody>
                    <p className="text-sm text-neutral-600">
                      The {type} modal type provides appropriate visual cues through
                      colors, icons, and styling to communicate the nature of the action.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button 
                      variant={type === "destructive" ? "destructive" : "default"}
                      className={
                        type === "warning" ? "bg-warning-600 hover:bg-warning-700 text-white" : ""
                      }
                    >
                      Confirm
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pre-built Confirmation Modals */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Modals</CardTitle>
          <CardDescription>
            Pre-built confirmation dialogs for common actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={() => setConfirmationModalOpen(true)}
            >
              Info Confirmation
            </Button>
            
            <Button 
              variant="outline"
              className="border-warning-300 text-warning-700 hover:bg-warning-50"
              onClick={() => setDestructiveModalOpen(true)}
            >
              Destructive Action
            </Button>
          </div>

          {/* Info Confirmation Modal */}
          <ConfirmationModal
            open={confirmationModalOpen}
            onOpenChange={setConfirmationModalOpen}
            type="info"
            title="Confirm Action"
            description="Are you sure you want to proceed with this action? This will update your settings."
            confirmText="Yes, Continue"
            cancelText="Cancel"
            onConfirm={() => {
              console.log("Action confirmed")
              setConfirmationModalOpen(false)
            }}
          />

          {/* Destructive Confirmation Modal */}
          <ConfirmationModal
            open={destructiveModalOpen}
            onOpenChange={setDestructiveModalOpen}
            type="destructive"
            title="Delete Content"
            description="This action cannot be undone. This will permanently delete the selected content and remove all associated data."
            confirmText="Delete"
            cancelText="Cancel"
            loading={loading}
            onConfirm={handleDestructiveAction}
          />
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Card>
        <CardHeader>
          <CardTitle>Form Modal</CardTitle>
          <CardDescription>
            Modal with form elements and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setFormModalOpen(true)}>
            Open Form Modal
          </Button>

          <Modal open={formModalOpen} onOpenChange={setFormModalOpen}>
            <ModalContent size="lg">
              <ModalHeader>
                <ModalTitle>Create New Campaign</ModalTitle>
                <ModalDescription>
                  Fill in the details below to create a new marketing campaign.
                </ModalDescription>
              </ModalHeader>
              
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input 
                      id="campaign-name" 
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Input 
                      id="client" 
                      placeholder="Select client"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your campaign objectives..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input 
                      id="start-date" 
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input 
                      id="budget" 
                      placeholder="$0.00"
                      type="number"
                    />
                  </div>
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setFormModalOpen(false)}>
                  Create Campaign
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </CardContent>
      </Card>

      {/* Responsive Modal */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Modal</CardTitle>
          <CardDescription>
            Modal that adapts to different screen sizes automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setResponsiveModalOpen(true)}>
            Open Responsive Modal
          </Button>

          <ResponsiveModal 
            open={responsiveModalOpen} 
            onOpenChange={setResponsiveModalOpen}
            size="xl"
          >
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Responsive Design</ModalTitle>
                <ModalDescription>
                  This modal automatically adapts to mobile screens by becoming full-screen
                  while maintaining the specified size on desktop.
                </ModalDescription>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Desktop Behavior</h4>
                      <p className="text-sm text-neutral-600">
                        On desktop screens, this modal maintains its specified size (xl)
                        and appears centered with backdrop blur.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Mobile Behavior</h4>
                      <p className="text-sm text-neutral-600">
                        On mobile devices, the modal automatically becomes full-screen
                        with appropriate margins for better usability.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Backdrop Blur</Badge>
                      <Badge variant="secondary">Smooth Animations</Badge>
                      <Badge variant="secondary">Responsive Sizing</Badge>
                      <Badge variant="secondary">Keyboard Navigation</Badge>
                      <Badge variant="secondary">Focus Management</Badge>
                    </div>
                  </div>
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setResponsiveModalOpen(false)}
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </ResponsiveModal>
        </CardContent>
      </Card>

      {/* Alert Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Dialogs</CardTitle>
          <CardDescription>
            Specialized alert dialogs for critical actions and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {alertTypes.map((type) => (
              <AlertDialog key={type}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={
                      type === "error" ? "border-error-300 text-error-700 hover:bg-error-50" :
                      type === "success" ? "border-success-300 text-success-700 hover:bg-success-50" :
                      type === "warning" ? "border-warning-300 text-warning-700 hover:bg-warning-50" :
                      type === "info" ? "border-info-300 text-info-700 hover:bg-info-50" :
                      ""
                    }
                  >
                    {type}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent type={type}>
                  <AlertDialogHeader type={type}>
                    <AlertDialogTitle>
                      {type.charAt(0).toUpperCase() + type.slice(1)} Alert
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This is a {type} alert dialog with contextual styling and appropriate actions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant={type === "error" ? "destructive" : "default"}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Quick Alert Examples</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setQuickAlertType("success")
                  setQuickAlertOpen(true)
                }}
              >
                Success Alert
              </Button>
              
              <Button 
                variant="outline"
                className="border-warning-300 text-warning-700 hover:bg-warning-50"
                onClick={() => {
                  setQuickAlertType("warning")
                  setQuickAlertOpen(true)
                }}
              >
                Warning Alert
              </Button>
              
              <Button 
                variant="outline"
                className="border-error-300 text-error-700 hover:bg-error-50"
                onClick={() => {
                  setQuickAlertType("error")
                  setQuickAlertOpen(true)
                }}
              >
                Error Alert
              </Button>
            </div>
          </div>

          {/* Quick Alert */}
          <QuickAlert
            open={quickAlertOpen}
            onOpenChange={setQuickAlertOpen}
            type={quickAlertType}
            title={
              quickAlertType === "success" ? "Operation Successful" :
              quickAlertType === "warning" ? "Warning: Action Required" :
              quickAlertType === "error" ? "Error Occurred" :
              "Information"
            }
            description={
              quickAlertType === "success" ? "Your content has been successfully published and is now live." :
              quickAlertType === "warning" ? "This action will affect multiple campaigns. Please review before proceeding." :
              quickAlertType === "error" ? "Unable to complete the operation. Please check your connection and try again." :
              "Please review the information below."
            }
            actionText={quickAlertType === "error" ? "Retry" : "OK"}
            cancelText={quickAlertType === "warning" ? "Cancel" : undefined}
            onAction={() => {
              console.log(`${quickAlertType} action confirmed`)
              setQuickAlertOpen(false)
            }}
          />
        </CardContent>
      </Card>

      {/* Modal Hook Example */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Hook Usage</CardTitle>
          <CardDescription>
            Using the useModal hook for advanced modal management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => deleteModal.openModal({ itemName: "Campaign #1" })}>
            Delete Item (Hook Example)
          </Button>

          <ConfirmationModal
            open={deleteModal.open}
            onOpenChange={deleteModal.onOpenChange}
            type="destructive"
            title="Delete Campaign"
            description={`Are you sure you want to delete "${deleteModal.data?.itemName}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            loading={deleteModal.loading}
            onConfirm={async () => {
              deleteModal.setLoading(true)
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1500))
              deleteModal.setLoading(false)
              deleteModal.closeModal()
              console.log("Item deleted:", deleteModal.data?.itemName)
            }}
          />
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Features</CardTitle>
          <CardDescription>
            Complete feature set for premium modal experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Visual Features</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Backdrop blur effect</li>
                <li>• Smooth enter/exit animations</li>
                <li>• Premium shadows and borders</li>
                <li>• Contextual icons and colors</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Responsive Design</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Adaptive sizing (sm to full)</li>
                <li>• Mobile-optimized layouts</li>
                <li>• Touch-friendly interactions</li>
                <li>• Safe area support</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Accessibility</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Keyboard navigation</li>
                <li>• Focus management</li>
                <li>• Screen reader support</li>
                <li>• ARIA attributes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}