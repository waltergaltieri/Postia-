#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function healthCheck() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query execution
    const userCount = await prisma.user.count();
    console.log(`✅ Query execution successful - Users: ${userCount}`);
    
    // Test transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.findMany({ take: 1 });
    });
    console.log('✅ Transaction test successful');
    
    console.log('🎉 Database health check passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

healthCheck();