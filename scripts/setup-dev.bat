@echo off
REM Setup development environment for Postia SaaS Platform

echo.
echo ========================================
echo 🚀 Postia SaaS - Development Setup
echo ========================================
echo.
echo 📋 This script sets up the development environment
echo    assuming dependencies are already installed.
echo.

REM Progress tracking
set STEP=1
set TOTAL_STEPS=6

echo [%STEP%/%TOTAL_STEPS%] 🔍 Validating development environment...
set /a STEP+=1

REM Check if Docker is running
echo    • Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Docker is not running
    echo    🔧 Please start Docker Desktop and try again
    echo    📥 Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo    ✅ Docker is running

REM Check if .env file exists
echo    • Checking environment configuration...
if not exist ".env" (
    echo    ❌ .env file not found
    echo    🔧 Run the main setup script first: scripts\setup.bat
    pause
    exit /b 1
)
echo    ✅ Environment file found

REM Check if node_modules exists
echo    • Checking project dependencies...
if not exist "node_modules" (
    echo    ❌ Dependencies not installed
    echo    🔧 Run: npm install
    pause
    exit /b 1
)
echo    ✅ Dependencies are installed

echo.
echo [%STEP%/%TOTAL_STEPS%] 📦 Starting database services...
set /a STEP+=1

echo    • Starting PostgreSQL and Redis containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo    ❌ Failed to start database services
    echo    🔧 Check if ports 5432 and 6379 are available
    echo    🔧 Run: docker-compose down && docker-compose up -d
    pause
    exit /b 1
)
echo    ✅ Database services started

echo.
echo [%STEP%/%TOTAL_STEPS%] ⏳ Waiting for services to be ready...
set /a STEP+=1

echo    • Waiting for PostgreSQL to start...
timeout /t 5 /nobreak >nul

REM Verify PostgreSQL is ready with retries
set RETRY_COUNT=0
:check_postgres
docker exec postia-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ PostgreSQL is ready
    goto postgres_ready
)
set /a RETRY_COUNT+=1
if %RETRY_COUNT% lss 6 (
    echo    • PostgreSQL starting... (attempt %RETRY_COUNT%/5)
    timeout /t 3 /nobreak >nul
    goto check_postgres
)
echo    ❌ PostgreSQL failed to start after 5 attempts
echo    🔧 Check logs: docker logs postia-postgres
pause

:postgres_ready
REM Verify Redis is ready
echo    • Checking Redis status...
docker exec postia-redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Redis is ready
) else (
    echo    ❌ Redis is not responding
    echo    🔧 Check logs: docker logs postia-redis
    pause
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 🔧 Setting up database schema...
set /a STEP+=1

echo    • Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo    ❌ Failed to generate Prisma client
    echo    🔧 Check DATABASE_URL in .env file
    pause
    exit /b 1
)
echo    ✅ Prisma client generated

echo    • Pushing database schema...
call npm run db:push
if %errorlevel% neq 0 (
    echo    ❌ Failed to push database schema
    echo    🔧 Ensure database connection is working
    pause
    exit /b 1
)
echo    ✅ Database schema updated

echo    • Seeding database with sample data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo    ⚠️  Failed to seed database (non-critical)
    echo    🔧 You can run 'npm run db:seed' manually later
) else (
    echo    ✅ Database seeded successfully
)

echo.
echo [%STEP%/%TOTAL_STEPS%] ✅ Running development environment verification...
set /a STEP+=1

echo    • Running installation verification...
npm run verify
if %errorlevel% neq 0 (
    echo    ⚠️  Some services may need additional time to start
    echo    🔧 Run 'npm run verify' or 'npm run health-check' for details
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 🎉 Development environment ready!
set /a STEP+=1

echo.
echo ========================================
echo ✅ Development Environment Ready!
echo ========================================
echo.
echo 🚀 Start Development:
echo    npm run dev
echo    → http://localhost:3000
echo.
echo 🛠️  Development Tools:
echo    • Database viewer: npm run db:studio → http://localhost:5555
echo    • Type checking: npm run type-check
echo    • Linting: npm run lint
echo    • Testing: npm test
echo.
echo 🔐 Demo Credentials:
echo    • Owner: owner@demo-agency.com / password123
echo    • Manager: manager@demo-agency.com / password123  
echo    • Collaborator: collaborator@demo-agency.com / password123
echo.
echo 🔧 Useful Commands:
echo    • Health check: npm run health-check
echo    • Installation verification: npm run verify
echo    • Reset database: npm run db:reset
echo    • View logs: docker logs postia-postgres
echo    • Stop services: docker-compose down
echo.
echo Press any key to exit...
pause >nul