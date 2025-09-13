@echo off
echo 🚀 Setting up Postia SaaS...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your API keys before continuing
    echo    Required: OPENAI_API_KEY, GEMINI_API_KEY
    pause
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 🐳 Docker detected. Starting database services...
    docker-compose up postgres redis -d
    
    REM Wait for services to be ready
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
) else (
    echo ⚠️  Docker not found. Please ensure PostgreSQL and Redis are running manually.
    echo    PostgreSQL: postgresql://postgres:postgres@localhost:5432/postia_dev
    echo    Redis: redis://localhost:6379
    pause
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

REM Run database migrations
echo 🗄️  Running database migrations...
npx prisma db push

REM Seed database with demo data
echo 🌱 Seeding database with demo data...
npm run db:seed

echo.
echo 🎉 Setup complete!
echo.
echo 🚀 To start the development server:
echo    npm run dev
echo.
echo 📊 To open Prisma Studio (database viewer):
echo    npm run db:studio
echo.
echo 🧪 To run tests:
echo    npm test
echo.
echo 📖 Visit http://localhost:3000 to access the application
echo.
echo 👤 Demo credentials:
echo    Email: admin@demo.com
echo    (Use Google OAuth or configure additional auth providers)
echo.
pause