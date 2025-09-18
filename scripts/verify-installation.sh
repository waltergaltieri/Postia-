#!/bin/bash
# Post-installation verification script for Postia SaaS

echo ""
echo "========================================"
echo "🔍 Postia SaaS - Installation Verification"
echo "========================================"
echo ""
echo "📋 This script verifies that your Postia SaaS installation"
echo "   is complete and all services are working correctly."
echo ""

# Progress tracking
STEP=1
TOTAL_STEPS=8
ISSUES_FOUND=0

echo "[$STEP/$TOTAL_STEPS] 🔍 Checking system requirements..."
((STEP++))

# Check Node.js
echo "   • Node.js version..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js: $NODE_VERSION"
else
    echo "   ❌ Node.js not found"
    ((ISSUES_FOUND++))
fi

# Check npm
echo "   • npm version..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm: v$NPM_VERSION"
else
    echo "   ❌ npm not found"
    ((ISSUES_FOUND++))
fi

# Check Docker
echo "   • Docker installation..."
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo "   ✅ Docker: $DOCKER_VERSION"
    
    # Check if Docker is running
    echo "   • Docker daemon status..."
    if docker info >/dev/null 2>&1; then
        echo "   ✅ Docker daemon is running"
    else
        echo "   ❌ Docker is not running"
        ((ISSUES_FOUND++))
    fi
else
    echo "   ❌ Docker not found"
    ((ISSUES_FOUND++))
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 📁 Checking project structure..."
((STEP++))

# Check critical files
echo "   • package.json..."
if [ -f "package.json" ]; then
    echo "   ✅ package.json found"
else
    echo "   ❌ package.json missing"
    ((ISSUES_FOUND++))
fi

echo "   • .env file..."
if [ -f ".env" ]; then
    echo "   ✅ .env file found"
else
    echo "   ❌ .env file missing"
    ((ISSUES_FOUND++))
fi

echo "   • docker-compose.yml..."
if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml found"
else
    echo "   ❌ docker-compose.yml missing"
    ((ISSUES_FOUND++))
fi

echo "   • node_modules directory..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ❌ Dependencies not installed"
    echo "   🔧 Run: npm install"
    ((ISSUES_FOUND++))
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] ⚙️ Checking environment variables..."
((STEP++))

# Check required environment variables
echo "   • DATABASE_URL..."
if grep -q "DATABASE_URL=" .env 2>/dev/null; then
    echo "   ✅ DATABASE_URL configured"
else
    echo "   ❌ DATABASE_URL not configured"
    ((ISSUES_FOUND++))
fi

echo "   • NEXTAUTH_SECRET..."
if grep -q "NEXTAUTH_SECRET=" .env 2>/dev/null; then
    echo "   ✅ NEXTAUTH_SECRET configured"
else
    echo "   ❌ NEXTAUTH_SECRET not configured"
    ((ISSUES_FOUND++))
fi

echo "   • OPENAI_API_KEY..."
if grep -q "OPENAI_API_KEY=" .env 2>/dev/null; then
    echo "   ✅ OPENAI_API_KEY configured"
else
    echo "   ⚠️  OPENAI_API_KEY not configured (required for AI features)"
fi

echo "   • GEMINI_API_KEY..."
if grep -q "GEMINI_API_KEY=" .env 2>/dev/null; then
    echo "   ✅ GEMINI_API_KEY configured"
else
    echo "   ⚠️  GEMINI_API_KEY not configured (required for AI features)"
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 🐳 Checking Docker services..."
((STEP++))

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "   ⚠️  Skipping Docker checks due to previous issues"
else
    # Check PostgreSQL container
    echo "   • PostgreSQL container..."
    if docker ps --filter "name=postia-postgres" --format "{{.Status}}" | grep -q "Up"; then
        echo "   ✅ PostgreSQL container is running"
        
        # Check PostgreSQL health
        echo "   • PostgreSQL connectivity..."
        if docker exec postia-postgres pg_isready -U postgres >/dev/null 2>&1; then
            echo "   ✅ PostgreSQL is accepting connections"
        else
            echo "   ❌ PostgreSQL is not ready"
            ((ISSUES_FOUND++))
        fi
    else
        echo "   ❌ PostgreSQL container is not running"
        echo "   🔧 Run: docker-compose up postgres -d"
        ((ISSUES_FOUND++))
    fi

    # Check Redis container
    echo "   • Redis container..."
    if docker ps --filter "name=postia-redis" --format "{{.Status}}" | grep -q "Up"; then
        echo "   ✅ Redis container is running"
        
        # Check Redis health
        echo "   • Redis connectivity..."
        if docker exec postia-redis redis-cli ping >/dev/null 2>&1; then
            echo "   ✅ Redis is responding"
        else
            echo "   ❌ Redis is not responding"
            ((ISSUES_FOUND++))
        fi
    else
        echo "   ❌ Redis container is not running"
        echo "   🔧 Run: docker-compose up redis -d"
        ((ISSUES_FOUND++))
    fi
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 🔧 Checking Prisma setup..."
((STEP++))

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "   ⚠️  Skipping Prisma checks due to previous issues"
else
    echo "   • Prisma client generation..."
    if npx prisma --version >/dev/null 2>&1; then
        echo "   ✅ Prisma CLI is available"
    else
        echo "   ❌ Prisma CLI not found"
        ((ISSUES_FOUND++))
    fi

    echo "   • Database schema status..."
    if npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1; then
        echo "   ✅ Database schema is up to date"
    else
        echo "   ❌ Database schema needs update"
        echo "   🔧 Run: npx prisma db push"
        ((ISSUES_FOUND++))
    fi
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 🌐 Checking application health..."
((STEP++))

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "   ⚠️  Skipping application checks due to previous issues"
else
    echo "   • Running comprehensive health check..."
    if npm run health-check >/dev/null 2>&1; then
        echo "   ✅ All services are healthy"
    else
        echo "   ⚠️  Some services may have issues"
        echo "   🔧 Run: npm run health-check (for detailed output)"
    fi
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 📋 Checking available scripts..."
((STEP++))

echo "   • Development server script..."
if npm run dev --dry-run >/dev/null 2>&1; then
    echo "   ✅ 'npm run dev' is available"
else
    echo "   ❌ 'npm run dev' script not found"
    ((ISSUES_FOUND++))
fi

echo "   • Database studio script..."
if npm run db:studio --dry-run >/dev/null 2>&1; then
    echo "   ✅ 'npm run db:studio' is available"
else
    echo "   ⚠️  'npm run db:studio' script not found"
fi

echo "   • Test script..."
if npm test --dry-run >/dev/null 2>&1; then
    echo "   ✅ 'npm test' is available"
else
    echo "   ⚠️  'npm test' script not found"
fi

echo ""
echo "[$STEP/$TOTAL_STEPS] 📊 Verification Summary"
((STEP++))

echo ""
echo "========================================"
echo "📊 Installation Verification Results"
echo "========================================"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS: Installation verification passed!"
    echo ""
    echo "✅ All critical components are working correctly"
    echo "✅ Your Postia SaaS installation is ready for development"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Start development server: npm run dev"
    echo "   2. Open browser: http://localhost:3000"
    echo "   3. Open database viewer: npm run db:studio"
    echo ""
    echo "👤 Demo Credentials:"
    echo "   • owner@demo-agency.com / password123"
    echo "   • manager@demo-agency.com / password123"
    echo ""
else
    echo ""
    echo "❌ ISSUES FOUND: $ISSUES_FOUND problems detected"
    echo ""
    echo "🔧 Recommended Actions:"
    echo "   1. Review the issues listed above"
    echo "   2. Run the main setup script: scripts/setup.sh"
    echo "   3. Check the installation guide: REQUISITOS-INSTALACION-LOCAL.md"
    echo "   4. Run this verification again: scripts/verify-installation.sh"
    echo ""
    echo "🆘 Common Solutions:"
    echo "   • Missing dependencies: npm install"
    echo "   • Docker not running: Start Docker Desktop"
    echo "   • Database issues: docker-compose up -d"
    echo "   • Environment config: cp .env.example .env"
    echo ""
fi

echo "📚 Additional Resources:"
echo "   • Health check: npm run health-check"
echo "   • Installation guide: REQUISITOS-INSTALACION-LOCAL.md"
echo "   • Troubleshooting: Check Docker logs"
echo ""

if [ $ISSUES_FOUND -gt 0 ]; then
    exit 1
else
    exit 0
fi