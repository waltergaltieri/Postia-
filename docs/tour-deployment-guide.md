# Tour Deployment Guide

## Overview

This guide covers the complete deployment process for the Postia SaaS tour system, including feature flags, environment configuration, monitoring setup, and rollout strategies.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Feature Flags](#feature-flags)
4. [Deployment Scripts](#deployment-scripts)
5. [Rollout Strategies](#rollout-strategies)
6. [Monitoring and Analytics](#monitoring-and-analytics)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Quick Start

### 1. Environment Setup

Copy the environment template and configure for your environment:

```bash
cp .env.tour.example .env.local
```

Edit `.env.local` with your specific configuration:

```bash
# Basic configuration
NEXT_PUBLIC_TOURS_ENABLED=true
NEXT_PUBLIC_TOUR_ENVIRONMENT=development
NEXT_PUBLIC_TOURS_AUTO_START=true
```

### 2. Deploy Tours

Use the deployment script to deploy tours to your target environment:

```bash
# Deploy to development
node scripts/deploy-tours.js --env development

# Deploy to staging
node scripts/deploy-tours.js --env staging

# Deploy to production (with dry run first)
node scripts/deploy-tours.js --env production --dry-run
node scripts/deploy-tours.js --env production
```

### 3. Verify Deployment

Check that tours are working correctly:

```bash
# Run health checks
node scripts/deploy-tours.js --env production --no-build --no-feature-flags
```

## Environment Configuration

### Configuration Files

The tour system uses multiple configuration files:

```
postia-saas/
├── .env.tour.example          # Environment template
├── .env.local                 # Local environment config
├── src/lib/config/
│   └── tour-env-config.ts     # Configuration manager
├── src/lib/deployment/
│   └── tour-deployment-config.ts # Deployment configuration
└── src/lib/feature-flags/
    └── feature-flags.ts       # Feature flag system
```

### Environment Variables

#### Core System

```bash
# Enable/disable tours globally
NEXT_PUBLIC_TOURS_ENABLED=true

# Environment (development, staging, production)
NEXT_PUBLIC_TOUR_ENVIRONMENT=production

# Auto-start tours for new users
NEXT_PUBLIC_TOURS_AUTO_START=true

# Debug mode (development only)
NEXT_PUBLIC_TOUR_DEBUG_MODE=false
```

#### Feature Flags

```bash
# Individual tour features
NEXT_PUBLIC_WELCOME_TOUR_ENABLED=true
NEXT_PUBLIC_CONTENT_GENERATION_TOUR_ENABLED=true
NEXT_PUBLIC_CAMPAIGN_MANAGEMENT_TOUR_ENABLED=true

# Advanced features
NEXT_PUBLIC_CONTEXTUAL_TOURS_ENABLED=false
NEXT_PUBLIC_INTELLIGENT_SUGGESTIONS_ENABLED=false
NEXT_PUBLIC_TOUR_PERSONALIZATION_ENABLED=false
```

#### Performance Settings

```bash
# Maximum concurrent tours
NEXT_PUBLIC_MAX_CONCURRENT_TOURS=1

# Tour timeout (15 minutes)
NEXT_PUBLIC_TOUR_TIMEOUT=900000

# Cache strategy
NEXT_PUBLIC_TOUR_CACHE_STRATEGY=localStorage
```

#### Analytics and Monitoring

```bash
# Analytics provider
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=google_analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Monitoring thresholds
NEXT_PUBLIC_TOUR_ERROR_RATE_THRESHOLD=0.02
NEXT_PUBLIC_TOUR_COMPLETION_RATE_THRESHOLD=0.7
```

### Environment-Specific Configurations

#### Development

```bash
NEXT_PUBLIC_TOUR_ENVIRONMENT=development
NEXT_PUBLIC_TOUR_DEBUG_MODE=true
NEXT_PUBLIC_TOUR_DEBUG_PANEL=true
NEXT_PUBLIC_CONTEXTUAL_TOURS_ENABLED=true
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=immediate
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=100
```

#### Staging

```bash
NEXT_PUBLIC_TOUR_ENVIRONMENT=staging
NEXT_PUBLIC_TOUR_DEBUG_MODE=true
NEXT_PUBLIC_CONTEXTUAL_TOURS_ENABLED=true
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=gradual
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=50
```

#### Production

```bash
NEXT_PUBLIC_TOUR_ENVIRONMENT=production
NEXT_PUBLIC_TOUR_DEBUG_MODE=false
NEXT_PUBLIC_TOUR_DEBUG_PANEL=false
NEXT_PUBLIC_CONTEXTUAL_TOURS_ENABLED=false
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=canary
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=10
```

## Feature Flags

### Feature Flag System

The tour system includes a comprehensive feature flag system for gradual rollouts and A/B testing.

#### Available Flags

```typescript
// Core system
TOURS_ENABLED
TOURS_AUTO_START
TOURS_ANALYTICS

// Individual tours
WELCOME_TOUR
CONTENT_GENERATION_TOUR
CAMPAIGN_MANAGEMENT_TOUR
ADMIN_FEATURES_TOUR

// Advanced features
CONTEXTUAL_TOURS
INTELLIGENT_SUGGESTIONS
TOUR_PERSONALIZATION
MOBILE_OPTIMIZED_TOURS

// Performance
TOUR_PRELOADING
TOUR_LAZY_LOADING

// Accessibility
ENHANCED_ACCESSIBILITY
HIGH_CONTRAST_TOURS
```

#### Using Feature Flags

```typescript
import { isTourFeatureEnabled } from '@/lib/feature-flags/feature-flags'

// Check if a feature is enabled
if (isTourFeatureEnabled('CONTEXTUAL_TOURS')) {
  // Show contextual tours
}

// In React components
import { useFeatureFlag } from '@/lib/feature-flags/feature-flags'

function MyComponent() {
  const isContextualToursEnabled = useFeatureFlag('CONTEXTUAL_TOURS')
  
  return (
    <div>
      {isContextualToursEnabled && <ContextualTourButton />}
    </div>
  )
}
```

#### Rollout Conditions

Feature flags support conditional rollouts:

```typescript
// Role-based rollout
{
  type: 'user_role',
  operator: 'equals',
  value: 'admin'
}

// Client-based rollout
{
  type: 'client_id',
  operator: 'in',
  value: ['premium-client-1', 'enterprise-client-2']
}

// Percentage-based rollout
{
  rolloutPercentage: 25 // 25% of users
}
```

## Deployment Scripts

### Main Deployment Script

The `deploy-tours.js` script handles the complete deployment process:

```bash
# Full deployment
node scripts/deploy-tours.js --env production

# Options
--env <environment>        # Target environment
--no-build                # Skip building bundles
--no-feature-flags        # Skip feature flag deployment
--no-health-check         # Skip health checks
--dry-run                 # Show what would be deployed
--verbose                 # Enable verbose logging
```

### Script Functions

#### Validation

```bash
# Validate tour configurations
node scripts/deploy-tours.js --env production --no-build --no-feature-flags --no-health-check
```

#### Building

```bash
# Build tour bundles only
node scripts/deploy-tours.js --env production --no-feature-flags --no-health-check
```

#### Health Checks

```bash
# Run health checks only
node scripts/deploy-tours.js --env production --no-build --no-feature-flags
```

### Custom Deployment Scripts

You can create custom deployment scripts for specific needs:

```javascript
// scripts/deploy-tours-custom.js
const { deployTours, validateTourConfigurations } = require('./deploy-tours')

async function customDeployment() {
  // Custom pre-deployment steps
  await validateTourConfigurations()
  
  // Custom deployment logic
  await deployTours()
  
  // Custom post-deployment steps
  console.log('Custom deployment completed')
}

customDeployment()
```

## Rollout Strategies

### Immediate Rollout

Deploy to all users immediately:

```bash
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=immediate
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=100
```

Use for:
- Development environment
- Critical bug fixes
- Well-tested features

### Gradual Rollout

Deploy to users gradually over time:

```bash
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=gradual
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=25
NEXT_PUBLIC_TOUR_ROLLOUT_DURATION=48
```

Use for:
- New features
- Staging environment
- Medium-risk changes

### Canary Rollout

Deploy to a small subset of users first:

```bash
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=canary
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=5
NEXT_PUBLIC_TOUR_ROLLOUT_DURATION=72
```

Use for:
- Production environment
- High-risk changes
- New tour types

### Blue-Green Rollout

Switch between two versions:

```bash
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=blue_green
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=100
```

Use for:
- Major version changes
- Complete tour system updates
- Zero-downtime deployments

### Rollout Criteria

Target specific user groups:

```typescript
// Admin users first
{
  type: 'user_role',
  values: ['admin'],
  percentage: 100
}

// Premium clients
{
  type: 'client_tier',
  values: ['premium', 'enterprise'],
  percentage: 50
}

// Geographic rollout
{
  type: 'geographic',
  values: ['US', 'CA'],
  percentage: 25
}
```

## Monitoring and Analytics

### Analytics Providers

#### Google Analytics 4

```bash
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=google_analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Events tracked:
- `tour_started`
- `tour_completed`
- `tour_skipped`
- `step_viewed`
- `step_completed`

#### Mixpanel

```bash
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your_token_here
```

#### Amplitude

```bash
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=amplitude
NEXT_PUBLIC_AMPLITUDE_API_KEY=your_api_key_here
```

#### Internal Analytics

```bash
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=internal
```

### Monitoring Setup

#### Error Tracking

```bash
NEXT_PUBLIC_TOUR_ERROR_TRACKING=true
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

#### Performance Monitoring

```bash
NEXT_PUBLIC_TOUR_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_TOUR_PERFORMANCE_TRACKING=true
```

#### Alert Thresholds

```bash
# Error rate threshold (2%)
NEXT_PUBLIC_TOUR_ERROR_RATE_THRESHOLD=0.02

# Completion rate threshold (70%)
NEXT_PUBLIC_TOUR_COMPLETION_RATE_THRESHOLD=0.7

# Duration threshold (3 minutes)
NEXT_PUBLIC_TOUR_DURATION_THRESHOLD=180
```

### Monitoring Dashboard

Access monitoring data programmatically:

```typescript
import { getTourMonitoring } from '@/lib/monitoring/tour-monitoring'

const monitoring = getTourMonitoring()

// Get tour analytics
const analytics = monitoring.getTourAnalytics('welcome-tour')
console.log('Completion rate:', analytics.completionRate)

// Get system health
const health = monitoring.getHealthStatus()
console.log('System status:', health.status)
```

## Troubleshooting

### Common Issues

#### Tours Not Loading

**Symptoms:**
- Tours don't appear
- Console errors about missing configurations

**Solutions:**
1. Check environment variables:
```bash
echo $NEXT_PUBLIC_TOURS_ENABLED
echo $NEXT_PUBLIC_TOUR_ENVIRONMENT
```

2. Validate configuration:
```typescript
import { getTourConfig } from '@/lib/config/tour-env-config'

const config = getTourConfig()
console.log('Config valid:', config.isConfigValid())
console.log('Errors:', config.getValidationErrors())
```

3. Check feature flags:
```typescript
import { getFeatureFlags } from '@/lib/feature-flags/feature-flags'

const flags = getFeatureFlags()
console.log('Enabled flags:', flags.getEnabledFlags())
```

#### Feature Flags Not Working

**Symptoms:**
- Features not rolling out as expected
- Inconsistent behavior across users

**Solutions:**
1. Check rollout configuration:
```bash
NEXT_PUBLIC_TOUR_ROLLOUT_STRATEGY=canary
NEXT_PUBLIC_TOUR_ROLLOUT_PERCENTAGE=10
```

2. Verify user context:
```typescript
import { initializeFeatureFlags } from '@/lib/feature-flags/feature-flags'

const context = {
  userId: 'user-123',
  userRole: 'admin',
  environment: 'production',
  timestamp: Date.now()
}

const flags = initializeFeatureFlags(context)
```

#### Performance Issues

**Symptoms:**
- Slow tour loading
- High memory usage
- Bundle size too large

**Solutions:**
1. Enable lazy loading:
```bash
NEXT_PUBLIC_TOUR_LAZY_LOADING_ENABLED=true
```

2. Optimize bundle:
```bash
NEXT_PUBLIC_TOUR_BUNDLE_OPTIMIZATION=true
```

3. Reduce concurrent tours:
```bash
NEXT_PUBLIC_MAX_CONCURRENT_TOURS=1
```

#### Analytics Not Tracking

**Symptoms:**
- No analytics data
- Missing events

**Solutions:**
1. Check analytics configuration:
```bash
NEXT_PUBLIC_TOUR_ANALYTICS_ENABLED=true
NEXT_PUBLIC_TOUR_ANALYTICS_PROVIDER=google_analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

2. Verify provider setup:
```typescript
import { getTourMonitoring } from '@/lib/monitoring/tour-monitoring'

const monitoring = getTourMonitoring()
monitoring.trackTourStart('welcome-tour', 'user-123', 'session-456')
```

### Debug Tools

#### Configuration Debug

```typescript
import { getTourConfig } from '@/lib/config/tour-env-config'

const config = getTourConfig()
console.log('Configuration summary:', config.getConfigSummary())
```

#### Feature Flag Debug

```typescript
import { getFeatureFlags } from '@/lib/feature-flags/feature-flags'

const flags = getFeatureFlags()
console.log('All flags:', flags.getFlagsForTourContext())
```

#### Deployment Debug

```typescript
import { getDeploymentManager } from '@/lib/deployment/tour-deployment-config'

const deployment = getDeploymentManager()
console.log('Deployment status:', deployment.getDeploymentStatus())
```

## Best Practices

### Environment Management

1. **Use environment-specific configurations**
   - Different settings for dev/staging/production
   - Gradual rollout in production
   - Full features in development

2. **Validate configurations**
   - Always validate before deployment
   - Use the built-in validation system
   - Test in staging first

3. **Monitor deployments**
   - Set up proper monitoring
   - Use health checks
   - Monitor key metrics

### Feature Flag Management

1. **Start with small rollouts**
   - Begin with 5-10% in production
   - Increase gradually based on metrics
   - Monitor for issues

2. **Use proper targeting**
   - Target admin users first
   - Roll out to premium clients
   - Consider geographic factors

3. **Clean up old flags**
   - Remove unused feature flags
   - Document flag purposes
   - Set expiration dates

### Deployment Process

1. **Follow the deployment checklist**
   - Validate configurations
   - Run tests
   - Deploy to staging first
   - Monitor metrics

2. **Use proper rollout strategies**
   - Canary for production
   - Gradual for staging
   - Immediate for development

3. **Have rollback plans**
   - Know how to disable features quickly
   - Monitor error rates
   - Have emergency contacts

### Monitoring and Analytics

1. **Set appropriate thresholds**
   - Error rate < 2%
   - Completion rate > 70%
   - Average duration < 3 minutes

2. **Monitor key metrics**
   - Tour completion rates
   - User engagement
   - Error rates
   - Performance metrics

3. **Set up alerts**
   - Critical errors
   - Performance degradation
   - Unusual patterns

---

## Deployment Checklist

### Pre-Deployment

- [ ] Configuration validated
- [ ] Tests passing
- [ ] Staging deployment successful
- [ ] Monitoring configured
- [ ] Rollback plan ready

### Deployment

- [ ] Feature flags configured
- [ ] Rollout strategy set
- [ ] Health checks passing
- [ ] Analytics tracking
- [ ] Error monitoring active

### Post-Deployment

- [ ] Metrics within thresholds
- [ ] User feedback positive
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Documentation updated

## Support

For deployment issues:

1. Check the troubleshooting section
2. Review configuration validation errors
3. Monitor system health status
4. Contact the development team with:
   - Environment details
   - Configuration summary
   - Error messages
   - Steps to reproduce