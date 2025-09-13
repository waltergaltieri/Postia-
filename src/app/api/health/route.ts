import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { log } from '@/lib/logging/logger';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message?: string;
  details?: any;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  try {
    // Database health check
    const dbCheck = await checkDatabase();
    checks.push(dbCheck);

    // External services health checks
    const openaiCheck = await checkOpenAI();
    checks.push(openaiCheck);

    const stripeCheck = await checkStripe();
    checks.push(stripeCheck);

    // System resources check
    const systemCheck = await checkSystemResources();
    checks.push(systemCheck);

    // Calculate overall status
    const summary = {
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    };

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks,
      summary,
    };

    // Log health check if there are issues
    if (overallStatus !== 'healthy') {
      log.warn('Health check detected issues', {
        status: overallStatus,
        summary,
        unhealthyServices: checks.filter(c => c.status === 'unhealthy').map(c => c.service),
      });
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    log.error('Health check failed', {}, error as Error);

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks: [{
        service: 'health-check',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: 'Health check system failure',
        details: { error: (error as Error).message },
      }],
      summary: { healthy: 0, degraded: 0, unhealthy: 1 },
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connectivity
    await db.$queryRaw`SELECT 1`;
    
    // Check database performance with a more complex query
    const agencyCount = await db.agency.count();
    const responseTime = Date.now() - startTime;

    if (responseTime > 5000) {
      return {
        service: 'database',
        status: 'degraded',
        responseTime,
        message: 'Database responding slowly',
        details: { agencyCount, threshold: '5000ms' },
      };
    }

    return {
      service: 'database',
      status: 'healthy',
      responseTime,
      details: { agencyCount },
    };

  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'Database connection failed',
      details: { error: (error as Error).message },
    };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        service: 'openai',
        status: 'unhealthy',
        responseTime: 0,
        message: 'OpenAI API key not configured',
      };
    }

    // Simple API call to check OpenAI connectivity
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        service: 'openai',
        status: 'unhealthy',
        responseTime,
        message: `OpenAI API error: ${response.status}`,
        details: { statusCode: response.status },
      };
    }

    if (responseTime > 5000) {
      return {
        service: 'openai',
        status: 'degraded',
        responseTime,
        message: 'OpenAI API responding slowly',
        details: { threshold: '5000ms' },
      };
    }

    return {
      service: 'openai',
      status: 'healthy',
      responseTime,
    };

  } catch (error) {
    return {
      service: 'openai',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'OpenAI API connection failed',
      details: { error: (error as Error).message },
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        service: 'stripe',
        status: 'degraded',
        responseTime: 0,
        message: 'Stripe not configured (optional)',
      };
    }

    // Simple API call to check Stripe connectivity
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        responseTime,
        message: `Stripe API error: ${response.status}`,
        details: { statusCode: response.status },
      };
    }

    return {
      service: 'stripe',
      status: 'healthy',
      responseTime,
    };

  } catch (error) {
    return {
      service: 'stripe',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'Stripe API connection failed',
      details: { error: (error as Error).message },
    };
  }
}

async function checkSystemResources(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Convert to MB
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    const responseTime = Date.now() - startTime;

    // Check for memory issues (adjust thresholds as needed)
    if (memoryUsageMB.heapUsed > 1000) { // 1GB
      return {
        service: 'system',
        status: 'degraded',
        responseTime,
        message: 'High memory usage detected',
        details: { memory: memoryUsageMB, cpu: cpuUsage },
      };
    }

    return {
      service: 'system',
      status: 'healthy',
      responseTime,
      details: { memory: memoryUsageMB, cpu: cpuUsage },
    };

  } catch (error) {
    return {
      service: 'system',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: 'System resource check failed',
      details: { error: (error as Error).message },
    };
  }
}