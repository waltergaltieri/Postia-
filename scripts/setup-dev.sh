#!/bin/bash

# Setup development environment for Postia SaaS Platform

echo "🚀 Setting up Postia development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start database services
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "📊 Pushing database schema..."
npm run db:push

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Use Prisma Studio to view data: npm run db:studio"
echo ""
echo "🔐 Sample login credentials:"
echo "Owner: owner@demo-agency.com / password123"
echo "Manager: manager@demo-agency.com / password123"
echo "Collaborator: collaborator@demo-agency.com / password123"