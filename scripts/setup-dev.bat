@echo off
REM Setup development environment for Postia SaaS Platform

echo 🚀 Setting up Postia development environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Start database services
echo 📦 Starting PostgreSQL and Redis containers...
docker-compose up -d

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npm run db:generate

REM Push database schema
echo 📊 Pushing database schema...
call npm run db:push

REM Seed database with sample data
echo 🌱 Seeding database with sample data...
call npm run db:seed

echo ✅ Development environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Start the development server: npm run dev
echo 2. Open http://localhost:3000 in your browser
echo 3. Use Prisma Studio to view data: npm run db:studio
echo.
echo 🔐 Sample login credentials:
echo Owner: owner@demo-agency.com / password123
echo Manager: manager@demo-agency.com / password123
echo Collaborator: collaborator@demo-agency.com / password123

pause