import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className
}: MobileModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="mobile-modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div className={cn("mobile-modal-content", isOpen && "open", className)}>
        {/* Header */}
        <div className="mobile-modal-header">
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="touch-button"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="mobile-modal-body">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="mobile-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}