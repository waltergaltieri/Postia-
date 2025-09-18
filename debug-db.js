const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database...');
    
    // Check users
    const users = await prisma.user.findMany({
      include: {
        agency: true
      }
    });
    
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log('User:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId
      });
    });
    
    // Check accounts
    const accounts = await prisma.account.findMany();
    console.log('\nAccounts found:', accounts.length);
    accounts.forEach(account => {
      console.log('Account:', {
        id: account.id,
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId
      });
    });
    
    // Check sessions
    const sessions = await prisma.session.findMany();
    console.log('\nSessions found:', sessions.length);
    sessions.forEach(session => {
      console.log('Session:', {
        id: session.id,
        userId: session.userId,
        expires: session.expires
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();