// Test accessibility function imports
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Accessibility Function Imports...');

try {
  // Read the compiled barrel export
  const indexPath = join(process.cwd(), 'src/lib/accessibility/index.ts');
  const indexContent = readFileSync(indexPath, 'utf8');
  
  console.log('📄 Index file content preview:');
  console.log(indexContent.substring(0, 500) + '...');
  
  // Check for specific exports
  const functions = [
    'announceToScreenReader',
    'trapFocus', 
    'getContrastRatio',
    'checkTourWCAGCompliance',
    'useReducedMotion',
    'useHighContrast'
  ];
  
  console.log('\n🔍 Checking for function exports:');
  
  functions.forEach(func => {
    if (indexContent.includes(func)) {
      console.log(`✅ ${func} - found in exports`);
    } else {
      console.log(`❌ ${func} - not found in exports`);
    }
  });
  
  // Check individual module files
  console.log('\n📁 Checking individual modules:');
  
  const modules = [
    { name: 'screen-reader.ts', functions: ['announceToScreenReader'] },
    { name: 'focus-trap.ts', functions: ['trapFocus'] },
    { name: 'color-contrast.ts', functions: ['getContrastRatio'] },
    { name: 'wcag-compliance.ts', functions: ['checkTourWCAGCompliance'] }
  ];
  
  modules.forEach(module => {
    try {
      const modulePath = join(process.cwd(), 'src/lib/accessibility', module.name);
      const moduleContent = readFileSync(modulePath, 'utf8');
      
      console.log(`\n📄 ${module.name}:`);
      module.functions.forEach(func => {
        if (moduleContent.includes(`export function ${func}`)) {
          console.log(`  ✅ ${func} - exported`);
        } else {
          console.log(`  ❌ ${func} - not found`);
        }
      });
    } catch (error) {
      console.log(`  ❌ ${module.name} - file not found`);
    }
  });
  
  console.log('\n🎉 Import testing completed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}