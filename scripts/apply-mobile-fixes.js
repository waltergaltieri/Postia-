#!/usr/bin/env node

/**
 * Apply Mobile Responsive Fixes
 * Automatically applies responsive fixes to components and styles
 */

const fs = require('fs');
const path = require('path');

class MobileFixApplicator {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixesApplied = [];
  }

  /**
   * Apply all mobile fixes
   */
  async applyFixes() {
    console.log('🔧 Applying mobile responsive fixes...\n');

    await this.fixOverflowIssues();
    await this.fixTextSizeIssues();
    await this.fixTouchTargets();
    await this.addHorizontalScrollWrappers();
    await this.optimizeModalsForMobile();

    this.generateReport();
  }

  /**
   * Fix overflow issues in components
   */
  async fixOverflowIssues() {
    console.log('📱 Fixing overflow issues...');

    const fixes = [
      {
        file: 'src/components/ui/content-card.tsx',
        search: /className="([^"]*)"([^>]*>)/g,
        replace: 'className="$1 responsive-container"$2',
        description: 'Added responsive container class'
      },
      {
        file: 'src/components/ui/optimized-image.tsx',
        search: /className="([^"]*)"([^>]*>)/g,
        replace: 'className="$1 responsive-image"$2',
        description: 'Added responsive image class'
      }
    ];

    await this.applyComponentFixes(fixes);
  }

  /**
   * Fix text size issues
   */
  async fixTextSizeIssues() {
    console.log('📝 Fixing text size issues...');

    const fixes = [
      {
        file: 'src/components/navigation/navigation-sidebar.tsx',
        search: /text-xs/g,
        replace: 'responsive-text-xs',
        description: 'Replaced fixed text-xs with responsive text sizing'
      },
      {
        file: 'src/components/navigation/navigation-sidebar.tsx',
        search: /text-sm/g,
        replace: 'responsive-text-sm',
        description: 'Replaced fixed text-sm with responsive text sizing'
      }
    ];

    await this.applyComponentFixes(fixes);
  }

  /**
   * Fix touch target sizes
   */
  async fixTouchTargets() {
    console.log('👆 Fixing touch target sizes...');

    const fixes = [
      {
        file: 'src/components/navigation/navigation-sidebar.tsx',
        search: /className="([^"]*btn[^"]*)"([^>]*>)/g,
        replace: 'className="$1 touch-button"$2',
        description: 'Added touch-friendly button sizing'
      }
    ];

    await this.applyComponentFixes(fixes);
  }

  /**
   * Add horizontal scroll wrappers for tables and wide content
   */
  async addHorizontalScrollWrappers() {
    console.log('📊 Adding horizontal scroll wrappers...');

    // This would typically scan for table elements and wrap them
    // For now, we'll create a utility component
    const tableWrapperComponent = `import React from 'react';
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
}`;

    const wrapperPath = path.join(this.srcPath, 'components', 'ui', 'horizontal-scroll.tsx');
    fs.writeFileSync(wrapperPath, tableWrapperComponent);
    
    this.fixesApplied.push({
      type: 'Component Creation',
      file: 'src/components/ui/horizontal-scroll.tsx',
      description: 'Created horizontal scroll wrapper components'
    });
  }

  /**
   * Optimize modals for mobile
   */
  async optimizeModalsForMobile() {
    console.log('🪟 Optimizing modals for mobile...');

    // Create mobile-optimized modal component
    const mobileModalComponent = `import React from 'react';
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
}`;

    const modalPath = path.join(this.srcPath, 'components', 'ui', 'mobile-modal.tsx');
    fs.writeFileSync(modalPath, mobileModalComponent);
    
    this.fixesApplied.push({
      type: 'Component Creation',
      file: 'src/components/ui/mobile-modal.tsx',
      description: 'Created mobile-optimized modal component'
    });
  }

  /**
   * Apply fixes to component files
   */
  async applyComponentFixes(fixes) {
    for (const fix of fixes) {
      const filePath = path.join(__dirname, '..', fix.file);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${fix.file}`);
        continue;
      }

      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        content = content.replace(fix.search, fix.replace);
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.fixesApplied.push({
            type: 'Component Fix',
            file: fix.file,
            description: fix.description
          });
          console.log(`   ✅ Fixed: ${fix.file}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Error fixing ${fix.file}: ${error.message}`);
      }
    }
  }

  /**
   * Generate report of applied fixes
   */
  generateReport() {
    console.log('\n📋 Generating Mobile Fixes Report...\n');

    const reportPath = path.join(__dirname, '..', 'audit-reports', 'mobile-fixes-applied.md');
    
    const timestamp = new Date().toISOString();
    let report = `# Mobile Responsive Fixes Applied

Generated: ${timestamp}

## Summary

Total fixes applied: ${this.fixesApplied.length}

## Applied Fixes

`;

    for (const fix of this.fixesApplied) {
      report += `### ${fix.type}: ${fix.file}
${fix.description}

`;
    }

    report += `## Next Steps

1. **Test the fixes**:
   - Test on mobile devices (iPhone, Android)
   - Test on different screen sizes
   - Verify touch targets are accessible
   - Check horizontal scrolling works smoothly

2. **Update components to use new utilities**:
   - Replace tables with \`<HorizontalScrollWrapper>\`
   - Use \`<MobileModal>\` for mobile-optimized modals
   - Apply responsive text classes where needed

3. **Validate accessibility**:
   - Ensure touch targets meet 44px minimum
   - Test keyboard navigation on mobile
   - Verify screen reader compatibility

## Usage Examples

### Horizontal Scroll Wrapper
\`\`\`tsx
import { HorizontalScrollWrapper } from '@/components/ui/horizontal-scroll';

<HorizontalScrollWrapper>
  <table>
    {/* Your table content */}
  </table>
</HorizontalScrollWrapper>
\`\`\`

### Mobile Modal
\`\`\`tsx
import { MobileModal } from '@/components/ui/mobile-modal';

<MobileModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  {/* Modal content */}
</MobileModal>
\`\`\`

### Responsive Text
\`\`\`tsx
<p className="responsive-text-base">
  This text will scale appropriately on mobile
</p>
\`\`\`
`;

    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report generated: ${reportPath}`);
    
    console.log('\n📊 Fixes Applied Summary:');
    console.log(`   Total Fixes: ${this.fixesApplied.length}`);
    console.log(`   Component Fixes: ${this.fixesApplied.filter(f => f.type === 'Component Fix').length}`);
    console.log(`   New Components: ${this.fixesApplied.filter(f => f.type === 'Component Creation').length}`);
  }
}

// Run the fix applicator
if (require.main === module) {
  const applicator = new MobileFixApplicator();
  applicator.applyFixes().catch(console.error);
}

module.exports = MobileFixApplicator;