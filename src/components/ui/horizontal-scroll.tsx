import React from 'react';
import { cn } from '@/lib/utils';

interface HorizontalScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function HorizontalScrollWrapper({ 
  children, 
  className 
}: HorizontalScrollWrapperProps) {
  return (
    <div className={cn("table-scroll-wrapper", className)}>
      {children}
    </div>
  );
}

export function CardGridScroll({ 
  children, 
  className 
}: HorizontalScrollWrapperProps) {
  return (
    <div className={cn("card-grid-scroll", className)}>
      {children}
    </div>
  );
}

export function HorizontalScroll({ 
  children, 
  className 
}: HorizontalScrollWrapperProps) {
  return (
    <div className={cn("horizontal-scroll", className)}>
      {children}
    </div>
  );
}