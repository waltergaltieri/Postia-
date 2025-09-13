#!/bin/bash

echo "🚀 Setting up Postia SaaS..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys before continuing"
    echo "   Required: OPENAI_API_KEY, GEMINI_API_KEY"
    read -p "Press Enter when you've configured your .env file..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. Starting database services..."
    docker-compose up postgres redis -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 10
else
    echo "⚠️  Docker not found. Please ensure PostgreSQL and Redis are running manually."
    echo "   PostgreSQL: postgresql://postgres:postgres@localhost:5432/postia_dev"
    echo "   Redis: redis://localhost:6379"
    read -p "Press Enter when your databases are ready..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma db push

# Seed database with demo data
echo "🌱 Seeding database with demo data..."
npm run db:seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "📊 To open Prisma Studio (database viewer):"
echo "   npm run db:studio"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
echo "📖 Visit http://localhost:3000 to access the application"
echo ""
echo "👤 Demo credentials:"
echo "   Email: admin@demo.com"
echo "   (Use Google OAuth or configure additional auth providers)"
echo ""