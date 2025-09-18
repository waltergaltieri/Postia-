@echo off
echo.
echo ========================================
echo 🚀 Postia SaaS - Setup Wizard
echo ========================================
echo.
echo 📋 This script will guide you through the complete setup process
echo    for the Postia SaaS development environment.
echo.

REM Progress tracking
set STEP=1
set TOTAL_STEPS=10

echo [%STEP%/%TOTAL_STEPS%] 🔍 Checking system requirements...
set /a STEP+=1

REM Check Node.js version
echo    • Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. 
    echo    📥 Please install Node.js 18+ from: https://nodejs.org/
    echo    ⚠️  Required for running the application and build tools
    pause
    exit /b 1
)

REM Get and validate Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    ✅ Node.js detected: %NODE_VERSION%

REM Check npm version
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    ✅ npm detected: v%NPM_VERSION%

REM Check if Git is available
echo    • Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    ⚠️  Git not found. Recommended for version control.
    echo       📥 Install from: https://git-scm.com/
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo    ✅ Git detected: %GIT_VERSION%
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 📝 Configuring environment variables...
set /a STEP+=1

REM Check if .env file exists
if not exist ".env" (
    echo    • Creating .env file from template...
    copy .env.example .env >nul
    if %errorlevel% equ 0 (
        echo    ✅ .env file created successfully
    ) else (
        echo    ❌ Failed to create .env file
        exit /b 1
    )
    echo.
    echo    ⚠️  IMPORTANT: Configure your API keys before continuing
    echo    📋 Required API keys:
    echo       • OPENAI_API_KEY - Get from: https://platform.openai.com/api-keys
    echo       • GEMINI_API_KEY - Get from: https://aistudio.google.com/app/apikey
    echo    📋 Optional API keys:
    echo       • STRIPE_SECRET_KEY - Get from: https://dashboard.stripe.com/apikeys
    echo       • STRIPE_PUBLISHABLE_KEY - Get from: https://dashboard.stripe.com/apikeys
    echo.
    echo    📖 Press any key when you have configured your API keys...
    pause >nul
) else (
    echo    ✅ .env file already exists
)

REM Validate critical environment variables
echo    • Validating environment configuration...
findstr /C:"OPENAI_API_KEY=" .env >nul
if %errorlevel% neq 0 (
    echo    ⚠️  OPENAI_API_KEY not found in .env file
) else (
    echo    ✅ OPENAI_API_KEY configured
)

findstr /C:"GEMINI_API_KEY=" .env >nul
if %errorlevel% neq 0 (
    echo    ⚠️  GEMINI_API_KEY not found in .env file
) else (
    echo    ✅ GEMINI_API_KEY configured
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 📦 Installing project dependencies...
set /a STEP+=1
echo    • Running npm install (this may take a few minutes)...
npm install
if %errorlevel% neq 0 (
    echo    ❌ Failed to install dependencies
    echo    🔧 Try running: npm cache clean --force
    echo    🔧 Then run this script again
    pause
    exit /b 1
)
echo    ✅ Dependencies installed successfully

echo.
echo [%STEP%/%TOTAL_STEPS%] 🐳 Setting up database services...
set /a STEP+=1

REM Check if Docker is available
echo    • Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo    ✅ Docker detected: %DOCKER_VERSION%
    
    REM Check if Docker is running
    echo    • Checking if Docker is running...
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo    ❌ Docker is not running
        echo    🔧 Please start Docker Desktop and try again
        pause
        exit /b 1
    )
    echo    ✅ Docker is running
    
    echo    • Starting database services (PostgreSQL and Redis)...
    docker-compose up postgres redis -d
    if %errorlevel% neq 0 (
        echo    ❌ Failed to start database services
        echo    🔧 Check docker-compose.yml file exists
        echo    🔧 Ensure ports 5432 and 6379 are not in use
        pause
        exit /b 1
    )
    
    echo    • Waiting for services to be ready...
    timeout /t 5 /nobreak >nul
    
    REM Verify PostgreSQL is ready
    echo    • Verifying PostgreSQL connection...
    docker exec postia-postgres pg_isready -U postgres >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ PostgreSQL is ready
    ) else (
        echo    ⚠️  PostgreSQL may still be starting up
        echo    • Waiting additional time...
        timeout /t 10 /nobreak >nul
        docker exec postia-postgres pg_isready -U postgres >nul 2>&1
        if %errorlevel% equ 0 (
            echo    ✅ PostgreSQL is now ready
        ) else (
            echo    ❌ PostgreSQL failed to start properly
            echo    🔧 Check Docker logs: docker logs postia-postgres
            pause
        )
    )
    
    REM Verify Redis is ready
    echo    • Verifying Redis connection...
    docker exec postia-redis redis-cli ping >nul 2>&1
    if %errorlevel% equ 0 (
        echo    ✅ Redis is ready
    ) else (
        echo    ❌ Redis failed to start properly
        echo    🔧 Check Docker logs: docker logs postia-redis
        pause
    )
    
) else (
    echo    ❌ Docker not found
    echo    📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo    ⚠️  Alternative: Ensure PostgreSQL and Redis are running manually
    echo       • PostgreSQL: postgresql://postgres:postgres@localhost:5432/postia_dev
    echo       • Redis: redis://localhost:6379
    echo.
    echo    Press any key to continue with manual database setup...
    pause >nul
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 🔧 Setting up database schema...
set /a STEP+=1

echo    • Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo    ❌ Failed to generate Prisma client
    echo    🔧 Check that DATABASE_URL is correctly configured in .env
    pause
    exit /b 1
)
echo    ✅ Prisma client generated

echo    • Pushing database schema...
npx prisma db push
if %errorlevel% neq 0 (
    echo    ❌ Failed to push database schema
    echo    🔧 Ensure database is running and accessible
    echo    🔧 Check DATABASE_URL in .env file
    pause
    exit /b 1
)
echo    ✅ Database schema updated

echo.
echo [%STEP%/%TOTAL_STEPS%] 🌱 Seeding database with demo data...
set /a STEP+=1

npm run db:seed
if %errorlevel% neq 0 (
    echo    ❌ Failed to seed database
    echo    ⚠️  This is not critical - you can continue without demo data
    echo    🔧 You can run 'npm run db:seed' manually later
    pause
) else (
    echo    ✅ Database seeded with demo data
)

echo.
echo [%STEP%/%TOTAL_STEPS%] ✅ Running post-installation verification...
set /a STEP+=1

echo    • Running comprehensive verification...
npm run verify
if %errorlevel% neq 0 (
    echo    ⚠️  Some issues were detected during verification
    echo    🔧 Review the output above and run 'npm run verify' again
    echo    🔧 You can also run 'npm run health-check' for detailed diagnostics
)

echo.
echo [%STEP%/%TOTAL_STEPS%] 🎉 Setup completed successfully!
set /a STEP+=1

echo.
echo ========================================
echo 🎉 Postia SaaS Setup Complete!
echo ========================================
echo.
echo 🚀 Next Steps:
echo    1. Start the development server:
echo       npm run dev
echo.
echo    2. Open your browser and visit:
echo       http://localhost:3000
echo.
echo 🛠️  Development Tools:
echo    • Database viewer (Prisma Studio):
echo      npm run db:studio
echo      → http://localhost:5555
echo.
echo    • Run tests:
echo      npm test              (unit tests)
echo      npm run test:e2e       (end-to-end tests)
echo.
echo    • Code quality:
echo      npm run lint           (check code style)
echo      npm run type-check     (TypeScript validation)
echo.
echo    • Health check:
echo      npm run health-check   (verify all services)
echo      npm run verify         (installation verification)
echo.
echo 👤 Demo Credentials:
echo    Email: owner@demo-agency.com
echo    Password: password123
echo.
echo    Email: manager@demo-agency.com  
echo    Password: password123
echo.
echo 📚 Additional Resources:
echo    • Documentation: ./docs/
echo    • Installation guide: ./REQUISITOS-INSTALACION-LOCAL.md
echo    • Troubleshooting: Run 'npm run health-check' for diagnostics
echo.
echo 🆘 Need Help?
echo    • Check logs: docker logs postia-postgres
echo    • Reset database: npm run db:reset
echo    • Clean install: npm run clean && npm install
echo.
echo Press any key to exit...
pause >nul