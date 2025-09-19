// Simple test to verify accessibility functions work
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Accessibility Functions...');

try {
  // Test TypeScript compilation of accessibility modules
  console.log('1. Testing TypeScript compilation...');
  
  const tscCommand = `npx tsc --noEmit --skipLibCheck src/lib/accessibility/index.ts`;
  execSync(tscCommand, { 
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  console.log('✅ TypeScript compilation successful');
  
  // Test that all functions are properly exported
  console.log('2. Testing function exports...');
  
  const testExports = `
    const fs = require('fs');
    const path = require('path');
    
    // Read the barrel export file
    const indexPath = path.join(__dirname, 'src/lib/accessibility/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check for key exports
    const expectedExports = [
      'useReducedMotion',
      'useHighContrast',
      'announceToScreenReader',
      'trapFocus',
      'getContrastRatio',
      'checkTourWCAGCompliance'
    ];
    
    let allExportsFound = true;
    expectedExports.forEach(exportName => {
      if (!indexContent.includes(exportName)) {
        console.log('❌ Missing export:', exportName);
        allExportsFound = false;
      }
    });
    
    if (allExportsFound) {
      console.log('✅ All expected exports found');
    }
  `;
  
  eval(testExports);
  
  console.log('3. Testing individual module files...');
  
  // Test each module file exists and compiles
  const modules = [
    'reduced-motion.ts',
    'screen-reader.ts',
    'focus-trap.ts',
    'color-contrast.ts',
    'high-contrast.ts',
    'keyboard-navigation.ts',
    'wcag-compliance.ts'
  ];
  
  modules.forEach(module => {
    const modulePath = path.join(__dirname, 'src/lib/accessibility', module);
    const fs = require('fs');
    
    if (fs.existsSync(modulePath)) {
      console.log(`✅ ${module} exists`);
      
      // Test TypeScript compilation
      try {
        execSync(`npx tsc --noEmit --skipLibCheck "${modulePath}"`, { 
          cwd: __dirname,
          stdio: 'pipe'
        });
        console.log(`✅ ${module} compiles successfully`);
      } catch (error) {
        console.log(`❌ ${module} compilation failed:`, error.message);
      }
    } else {
      console.log(`❌ ${module} not found`);
    }
  });
  
  console.log('\n🎉 Accessibility function testing completed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}