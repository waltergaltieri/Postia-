#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
}

class HealthChecker {
  private results: HealthCheckResult[] = [];

  private addResult(service: string, status: 'healthy' | 'unhealthy' | 'warning', message: string, details?: any) {
    this.results.push({ service, status, message, details });
  }

  private logResult(result: HealthCheckResult) {
    const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.service}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
  }

  async checkDockerServices(): Promise<void> {
    console.log('\n🐳 Checking Docker services...');
    
    try {
      // Check if Docker is running
      await execAsync('docker --version');
      this.addResult('Docker', 'healthy', 'Docker is installed and accessible');
    } catch (error) {
      this.addResult('Docker', 'unhealthy', 'Docker is not installed or not accessible', error);
      return;
    }

    // Check PostgreSQL container
    try {
      const { stdout: pgStatus } = await execAsync('docker ps --filter "name=postia-postgres" --format "{{.Status}}"');
      if (pgStatus.trim().includes('Up')) {
        this.addResult('PostgreSQL Container', 'healthy', 'PostgreSQL container is running');
        
        // Check PostgreSQL health
        try {
          await execAsync('docker exec postia-postgres pg_isready -U postgres');
          this.addResult('PostgreSQL Health', 'healthy', 'PostgreSQL is ready to accept connections');
        } catch (error) {
          this.addResult('PostgreSQL Health', 'unhealthy', 'PostgreSQL is not ready', error);
        }
      } else {
        this.addResult('PostgreSQL Container', 'unhealthy', 'PostgreSQL container is not running');
      }
    } catch (error) {
      this.addResult('PostgreSQL Container', 'unhealthy', 'Failed to check PostgreSQL container status', error);
    }

    // Check Redis container
    try {
      const { stdout: redisStatus } = await execAsync('docker ps --filter "name=postia-redis" --format "{{.Status}}"');
      if (redisStatus.trim().includes('Up')) {
        this.addResult('Redis Container', 'healthy', 'Redis container is running');
        
        // Check Redis health
        try {
          await execAsync('docker exec postia-redis redis-cli ping');
          this.addResult('Redis Health', 'healthy', 'Redis is responding to ping');
        } catch (error) {
          this.addResult('Redis Health', 'unhealthy', 'Redis is not responding', error);
        }
      } else {
        this.addResult('Redis Container', 'unhealthy', 'Redis container is not running');
      }
    } catch (error) {
      this.addResult('Redis Container', 'unhealthy', 'Failed to check Redis container status', error);
    }
  }

  async checkDatabaseConnectivity(): Promise<void> {
    console.log('\n🗄️ Checking database connectivity...');
    
    try {
      // Test Prisma connection with timeout
      await Promise.race([
        (async () => {
          await prisma.$connect();
          this.addResult('Database Connection', 'healthy', 'Successfully connected to database via Prisma');
          
          // Test basic query
          const userCount = await prisma.user.count();
          this.addResult('Database Query', 'healthy', `Database queries working - Users: ${userCount}`);
          
          // Test transaction
          await prisma.$transaction(async (tx) => {
            await tx.user.findMany({ take: 1 });
          });
          this.addResult('Database Transaction', 'healthy', 'Database transactions working');
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);
      
    } catch (error: any) {
      this.addResult('Database Connection', 'unhealthy', 'Failed to connect to database', error.message);
    } finally {
      try {
        await prisma.$disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    }
  }

  async checkRedisConnectivity(): Promise<void> {
    console.log('\n🔴 Checking Redis connectivity...');
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        commandTimeout: 5000,
      }
    });
    
    try {
      // Set up error handler to prevent unhandled rejections
      client.on('error', () => {
        // Silently handle connection errors - they will be caught below
      });
      
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      
      this.addResult('Redis Connection', 'healthy', 'Successfully connected to Redis');
      
      // Test Redis operations with timeout
      await Promise.race([
        (async () => {
          await client.set('health-check', 'test-value', { EX: 10 });
          const value = await client.get('health-check');
          
          if (value === 'test-value') {
            this.addResult('Redis Operations', 'healthy', 'Redis read/write operations working');
          } else {
            this.addResult('Redis Operations', 'warning', 'Redis operations may have issues');
          }
          
          await client.del('health-check');
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis operations timeout')), 5000)
        )
      ]);
      
    } catch (error: any) {
      this.addResult('Redis Connection', 'unhealthy', 'Failed to connect to Redis', error.message);
    } finally {
      try {
        if (client.isOpen) {
          await client.quit();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async checkExternalAPIs(): Promise<void> {
    console.log('\n🌐 Checking external API connectivity...');
    
    // Check OpenAI API
    if (process.env.OPENAI_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.addResult('OpenAI API', 'healthy', 'OpenAI API is accessible');
        } else {
          this.addResult('OpenAI API', 'unhealthy', `OpenAI API returned status: ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          this.addResult('OpenAI API', 'unhealthy', 'OpenAI API request timed out');
        } else {
          this.addResult('OpenAI API', 'unhealthy', 'Failed to connect to OpenAI API', error.message);
        }
      }
    } else {
      this.addResult('OpenAI API', 'warning', 'OpenAI API key not configured');
    }

    // Check Google Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.addResult('Gemini API', 'healthy', 'Google Gemini API is accessible');
        } else {
          this.addResult('Gemini API', 'unhealthy', `Gemini API returned status: ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          this.addResult('Gemini API', 'unhealthy', 'Gemini API request timed out');
        } else {
          this.addResult('Gemini API', 'unhealthy', 'Failed to connect to Gemini API', error.message);
        }
      }
    } else {
      this.addResult('Gemini API', 'warning', 'Gemini API key not configured');
    }

    // Check Stripe API
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('https://api.stripe.com/v1/account', {
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.addResult('Stripe API', 'healthy', 'Stripe API is accessible');
        } else {
          this.addResult('Stripe API', 'unhealthy', `Stripe API returned status: ${response.status}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          this.addResult('Stripe API', 'unhealthy', 'Stripe API request timed out');
        } else {
          this.addResult('Stripe API', 'unhealthy', 'Failed to connect to Stripe API', error.message);
        }
      }
    } else {
      this.addResult('Stripe API', 'warning', 'Stripe API key not configured');
    }
  }

  async checkApplicationHealth(): Promise<void> {
    console.log('\n🚀 Checking application health...');
    
    try {
      // Check if Next.js app is running
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:3000/api/health', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.addResult('Next.js Application', 'healthy', 'Application is running and responding');
      } else {
        this.addResult('Next.js Application', 'unhealthy', `Application returned status: ${response.status}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.addResult('Next.js Application', 'warning', 'Application request timed out');
      } else {
        this.addResult('Next.js Application', 'warning', 'Application may not be running on localhost:3000', error.message);
      }
    }

    // Check if Prisma Studio is accessible
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('http://localhost:5555', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.addResult('Prisma Studio', 'healthy', 'Prisma Studio is accessible');
      } else {
        this.addResult('Prisma Studio', 'warning', 'Prisma Studio may not be running');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.addResult('Prisma Studio', 'warning', 'Prisma Studio request timed out');
      } else {
        this.addResult('Prisma Studio', 'warning', 'Prisma Studio is not accessible on localhost:5555');
      }
    }
  }

  async checkEnvironmentVariables(): Promise<void> {
    console.log('\n⚙️ Checking environment variables...');
    
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
    ];

    const optionalVars = [
      'REDIS_URL',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'STRIPE_SECRET_KEY',
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.addResult(`Env: ${varName}`, 'healthy', 'Required environment variable is set');
      } else {
        this.addResult(`Env: ${varName}`, 'unhealthy', 'Required environment variable is missing');
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        this.addResult(`Env: ${varName}`, 'healthy', 'Optional environment variable is set');
      } else {
        this.addResult(`Env: ${varName}`, 'warning', 'Optional environment variable is not set');
      }
    }
  }

  printSummary(): void {
    console.log('\n📊 Health Check Summary');
    console.log('========================');
    
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length;
    
    console.log(`✅ Healthy: ${healthy}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Unhealthy: ${unhealthy}`);
    console.log(`📋 Total Checks: ${this.results.length}`);
    
    if (unhealthy > 0) {
      console.log('\n❌ Critical Issues Found:');
      this.results
        .filter(r => r.status === 'unhealthy')
        .forEach(result => console.log(`   - ${result.service}: ${result.message}`));
    }
    
    if (warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => console.log(`   - ${result.service}: ${result.message}`));
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (unhealthy === 0) {
      console.log('🎉 System is ready for development!');
      return true;
    } else {
      console.log('🔧 Please fix the critical issues before proceeding.');
      return false;
    }
  }

  async runAllChecks(): Promise<boolean> {
    console.log('🏥 Starting Postia SaaS Health Check...');
    console.log('=====================================');
    
    const runWithTimeout = async (checkFn: () => Promise<void>, name: string, timeoutMs: number = 10000) => {
      try {
        await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${name} timed out`)), timeoutMs)
          )
        ]);
      } catch (error: any) {
        this.addResult(name, 'unhealthy', `Check failed: ${error.message}`);
      }
    };
    
    await runWithTimeout(() => this.checkEnvironmentVariables(), 'Environment Variables', 2000);
    await runWithTimeout(() => this.checkDockerServices(), 'Docker Services', 15000);
    await runWithTimeout(() => this.checkDatabaseConnectivity(), 'Database Connectivity', 10000);
    await runWithTimeout(() => this.checkRedisConnectivity(), 'Redis Connectivity', 8000);
    await runWithTimeout(() => this.checkExternalAPIs(), 'External APIs', 15000);
    await runWithTimeout(() => this.checkApplicationHealth(), 'Application Health', 8000);
    
    // Log all results
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => this.logResult(result));
    
    return this.printSummary();
  }
}

// Main execution
async function main() {
  const checker = new HealthChecker();
  
  try {
    // Set overall timeout for health check
    const isHealthy = await Promise.race([
      checker.runAllChecks(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timed out after 30 seconds')), 30000)
      )
    ]);
    
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { HealthChecker };