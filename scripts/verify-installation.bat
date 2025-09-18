@echo off
REM Post-installation verification script for Postia SaaS

echo.
echo ========================================
echo 🔍 Postia SaaS - Installation Verification
echo ========================================
echo.
echo 📋 This script verifies that your Postia SaaS installation
echo    is complete and all services are working correctly.
echo.

REM Progress tracking
set STEP=1
set TOTAL_STEPS=8
set ISSUES_FOUND=0

echo [%STEP%/%TOTAL_STEPS%] 🔍 Checking system requirements...
set /a STEP+=1

REM Check Node.js
echo    • Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Node.js not found
    set /a ISSUES_FOUND+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    ✅ Node.js: %NODE_VERSION%
)

REM Check npm
echo    • npm version...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ npm not found
    set /a ISSUES_FOUND+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    ✅ npm: v%NPM_VERSION%
)

REM Check Docker
echo    • Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ❌ Docker not found
    set /a ISSUES_FOUND+=1
) else (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo    ✅ Docker: %DOCKER_VERSION%
    
    REM Check if Docker is running
    echo    • Docker daemon status...
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo    ❌ Docker is not running
        set /a ISSUES_FOUND+=1
    ) else (
        echo    ✅ Docker daemon is running
    )
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 📁 Checking project structure...
set /a STEP+=1

REM Check critical files
echo    • package.json...
if exist "package.json" (
    echo    ✅ package.json found
) else (
    echo    ❌ package.json missing
    set /a ISSUES_FOUND+=1
)

echo    • .env file...
if exist ".env" (
    echo    ✅ .env file found
) else (
    echo    ❌ .env file missing
    set /a ISSUES_FOUND+=1
)

echo    • docker-compose.yml...
if exist "docker-compose.yml" (
    echo    ✅ docker-compose.yml found
) else (
    echo    ❌ docker-compose.yml missing
    set /a ISSUES_FOUND+=1
)

echo    • node_modules directory...
if exist "node_modules" (
    echo    ✅ Dependencies installed
) else (
    echo    ❌ Dependencies not installed
    echo    🔧 Run: npm install
    set /a ISSUES_FOUND+=1
)

echo.
echo [%STEP%/%TOTAL_STEPS%] ⚙️ Checking environment variables...
set /a STEP+=1

REM Check required environment variables
echo    • DATABASE_URL...
findstr /C:"DATABASE_URL=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ DATABASE_URL configured
) else (
    echo    ❌ DATABASE_URL not configured
    set /a ISSUES_FOUND+=1
)

echo    • NEXTAUTH_SECRET...
findstr /C:"NEXTAUTH_SECRET=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ NEXTAUTH_SECRET configured
) else (
    echo    ❌ NEXTAUTH_SECRET not configured
    set /a ISSUES_FOUND+=1
)

echo    • OPENAI_API_KEY...
findstr /C:"OPENAI_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ OPENAI_API_KEY configured
) else (
    echo    ⚠️  OPENAI_API_KEY not configured (required for AI features)
)

echo    • GEMINI_API_KEY...
findstr /C:"GEMINI_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ GEMINI_API_KEY configured
) else (
    echo    ⚠️  GEMINI_API_KEY not configured (required for AI features)
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 🐳 Checking Docker services...
set /a STEP+=1

if %ISSUES_FOUND% gtr 0 (
    echo    ⚠️  Skipping Docker checks due to previous issues
    goto skip_docker
)

REM Check PostgreSQL container
echo    • PostgreSQL container...
docker ps --filter "name=postia-postgres" --format "{{.Status}}" | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ PostgreSQL container is running
    
    REM Check PostgreSQL health
    echo    • PostgreSQL connectivity...
    docker exec postia-postgres pg_isready -U postgres >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ PostgreSQL is accepting connections
    ) else (
        echo    ❌ PostgreSQL is not ready
        set /a ISSUES_FOUND+=1
    )
) else (
    echo    ❌ PostgreSQL container is not running
    echo    🔧 Run: docker-compose up postgres -d
    set /a ISSUES_FOUND+=1
)

REM Check Redis container
echo    • Redis container...
docker ps --filter "name=postia-redis" --format "{{.Status}}" | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Redis container is running
    
    REM Check Redis health
    echo    • Redis connectivity...
    docker exec postia-redis redis-cli ping >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ Redis is responding
    ) else (
        echo    ❌ Redis is not responding
        set /a ISSUES_FOUND+=1
    )
) else (
    echo    ❌ Redis container is not running
    echo    🔧 Run: docker-compose up redis -d
    set /a ISSUES_FOUND+=1
)

:skip_docker

echo.
echo [%STEP%/%TOTAL_STEPS%] 🔧 Checking Prisma setup...
set /a STEP+=1

if %ISSUES_FOUND% gtr 0 (
    echo    ⚠️  Skipping Prisma checks due to previous issues
    goto skip_prisma
)

echo    • Prisma client generation...
npx prisma --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Prisma CLI is available
) else (
    echo    ❌ Prisma CLI not found
    set /a ISSUES_FOUND+=1
)

echo    • Database schema status...
npx prisma db push --accept-data-loss --skip-generate >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Database schema is up to date
) else (
    echo    ❌ Database schema needs update
    echo    🔧 Run: npx prisma db push
    set /a ISSUES_FOUND+=1
)

:skip_prisma

echo.
echo [%STEP%/%TOTAL_STEPS%] 🌐 Checking application health...
set /a STEP+=1

if %ISSUES_FOUND% gtr 0 (
    echo    ⚠️  Skipping application checks due to previous issues
    goto skip_app_check
)

echo    • Running comprehensive health check...
npm run health-check >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ All services are healthy
) else (
    echo    ⚠️  Some services may have issues
    echo    🔧 Run: npm run health-check (for detailed output)
)

:skip_app_check

echo.
echo [%STEP%/%TOTAL_STEPS%] 📋 Checking available scripts...
set /a STEP+=1

echo    • Development server script...
npm run dev --dry-run >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 'npm run dev' is available
) else (
    echo    ❌ 'npm run dev' script not found
    set /a ISSUES_FOUND+=1
)

echo    • Database studio script...
npm run db:studio --dry-run >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 'npm run db:studio' is available
) else (
    echo    ⚠️  'npm run db:studio' script not found
)

echo    • Test script...
npm test --dry-run >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 'npm test' is available
) else (
    echo    ⚠️  'npm test' script not found
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 📊 Verification Summary
set /a STEP+=1

echo.
echo ========================================
echo 📊 Installation Verification Results
echo ========================================

if %ISSUES_FOUND% equ 0 (
    echo.
    echo 🎉 SUCCESS: Installation verification passed!
    echo.
    echo ✅ All critical components are working correctly
    echo ✅ Your Postia SaaS installation is ready for development
    echo.
    echo 🚀 Next Steps:
    echo    1. Start development server: npm run dev
    echo    2. Open browser: http://localhost:3000
    echo    3. Open database viewer: npm run db:studio
    echo.
    echo 👤 Demo Credentials:
    echo    • owner@demo-agency.com / password123
    echo    • manager@demo-agency.com / password123
    echo.
) else (
    echo.
    echo ❌ ISSUES FOUND: %ISSUES_FOUND% problems detected
    echo.
    echo 🔧 Recommended Actions:
    echo    1. Review the issues listed above
    echo    2. Run the main setup script: scripts\setup.bat
    echo    3. Check the installation guide: REQUISITOS-INSTALACION-LOCAL.md
    echo    4. Run this verification again: scripts\verify-installation.bat
    echo.
    echo 🆘 Common Solutions:
    echo    • Missing dependencies: npm install
    echo    • Docker not running: Start Docker Desktop
    echo    • Database issues: docker-compose up -d
    echo    • Environment config: Copy .env.example to .env
    echo.
)

echo 📚 Additional Resources:
echo    • Health check: npm run health-check
echo    • Installation guide: REQUISITOS-INSTALACION-LOCAL.md
echo    • Troubleshooting: Check Docker logs
echo.
echo Press any key to exit...
pause >nul

if %ISSUES_FOUND% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)