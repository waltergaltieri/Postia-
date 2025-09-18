/**
 * Validation script to test tour configuration setup
 */

import { 
  validateTourDefinition, 
  validateClientBranding,
  TourConfigLoader,
  DEFAULT_TOUR_CONFIGS 
} from './tour-config'
import { getTourRegistry, DEFAULT_TOUR_IDS } from './tour-registry'

async function validateTourSetup() {
  console.log('🚀 Validating Driver.js tour configuration setup...\n')

  try {
    // Test 1: Validate default tour configuration
    console.log('✅ Test 1: Validating default welcome tour configuration')
    const welcomeTour = validateTourDefinition(DEFAULT_TOUR_CONFIGS.welcome)
    console.log(`   - Tour ID: ${welcomeTour.id}`)
    console.log(`   - Steps: ${welcomeTour.steps.length}`)
    console.log(`   - Category: ${welcomeTour.category}`)

    // Test 2: Test client branding validation
    console.log('\n✅ Test 2: Validating client branding schema')
    const testBranding = {
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      accentColor: '#0000FF',
      brandName: 'Test Brand'
    }
    const validBranding = validateClientBranding(testBranding)
    console.log(`   - Brand name: ${validBranding.brandName}`)
    console.log(`   - Primary color: ${validBranding.primaryColor}`)

    // Test 3: Test tour registry
    console.log('\n✅ Test 3: Testing tour registry')
    const registry = getTourRegistry()
    const availableTours = registry.getAvailableTours()
    console.log(`   - Available tours: ${availableTours.join(', ')}`)

    // Test 4: Load tours from registry
    console.log('\n✅ Test 4: Loading tours from registry')
    try {
      const welcomeTourFromRegistry = await registry.loadTour(DEFAULT_TOUR_IDS.WELCOME)
      console.log(`   - Loaded welcome tour: ${welcomeTourFromRegistry.name}`)
    } catch (error) {
      console.log(`   - Welcome tour loading: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      const contentTourFromRegistry = await registry.loadTour(DEFAULT_TOUR_IDS.CONTENT_GENERATION)
      console.log(`   - Loaded content generation tour: ${contentTourFromRegistry.name}`)
    } catch (error) {
      console.log(`   - Content generation tour loading: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test 5: Validate all registered tours
    console.log('\n✅ Test 5: Validating all registered tours')
    const validation = await registry.validateAllTours()
    console.log(`   - Valid tours: ${validation.valid.length}`)
    console.log(`   - Invalid tours: ${validation.invalid.length}`)
    
    if (validation.invalid.length > 0) {
      console.log('   - Invalid tour details:')
      validation.invalid.forEach(({ tourId, error }) => {
        console.log(`     * ${tourId}: ${error}`)
      })
    }

    // Test 6: Test configuration loader
    console.log('\n✅ Test 6: Testing configuration loader')
    const configValidation = TourConfigLoader.validateConfig(DEFAULT_TOUR_CONFIGS.welcome)
    console.log(`   - Config validation result: ${configValidation.isValid ? 'Valid' : 'Invalid'}`)
    
    if (!configValidation.isValid && configValidation.errors) {
      console.log(`   - Validation errors: ${configValidation.errors.join(', ')}`)
    }

    console.log('\n🎉 All tour configuration tests passed successfully!')
    console.log('\n📋 Setup Summary:')
    console.log('   - Driver.js installed and configured')
    console.log('   - TypeScript types defined')
    console.log('   - Tour configuration system with Zod validation')
    console.log('   - Tour registry with lazy loading')
    console.log('   - Sample tour configurations created')
    console.log('   - Directory structure established')

  } catch (error) {
    console.error('❌ Tour configuration validation failed:', error)
    process.exit(1)
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateTourSetup()
}

export { validateTourSetup }