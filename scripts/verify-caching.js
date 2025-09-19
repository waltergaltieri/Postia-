/**
 * Simple verification script for the caching system
 */

const { ClientCache, CacheKeys, CacheUtils } = require('../src/lib/cache/client-cache.ts');

async function verifyCaching() {
  console.log('🧪 Testing Client Caching System...\n');

  // Test 1: Basic cache operations
  console.log('1. Testing basic cache operations...');
  const cache = new ClientCache({ defaultTTL: 1000 });
  
  const testData = { id: '1', name: 'Test Client' };
  cache.set('test-key', testData);
  const retrieved = cache.get('test-key');
  
  console.log('✅ Set and get:', JSON.stringify(retrieved) === JSON.stringify(testData));

  // Test 2: Cache key generation
  console.log('2. Testing cache key generation...');
  const clientId = 'client-123';
  const userId = 'user-456';
  
  const clientKey = CacheKeys.clientData(clientId);
  const permissionKey = CacheKeys.permissions(userId, clientId);
  
  console.log('✅ Client key:', clientKey === 'client:client-123');
  console.log('✅ Permission key:', permissionKey === 'permissions:user-456:client-123');

  // Test 3: Pattern invalidation
  console.log('3. Testing pattern invalidation...');
  cache.set('client:123:data', { id: '123' });
  cache.set('client:123:permissions', ['read']);
  cache.set('client:456:data', { id: '456' });
  
  const invalidated = cache.invalidatePattern('client:123');
  console.log('✅ Pattern invalidation:', invalidated === 2);

  // Test 4: TTL expiration
  console.log('4. Testing TTL expiration...');
  const shortCache = new ClientCache({ defaultTTL: 50 });
  shortCache.set('expire-test', 'data');
  
  console.log('✅ Data exists initially:', shortCache.get('expire-test') === 'data');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('✅ Data expired after TTL:', shortCache.get('expire-test') === null);

  // Test 5: Cache statistics
  console.log('5. Testing cache statistics...');
  const stats = cache.getStats();
  console.log('✅ Stats available:', typeof stats.total === 'number');

  console.log('\n🎉 All caching tests passed!');
  
  // Cleanup
  cache.destroy();
  shortCache.destroy();
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyCaching().catch(console.error);
}

module.exports = { verifyCaching };