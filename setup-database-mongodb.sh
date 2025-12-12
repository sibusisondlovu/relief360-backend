#!/bin/bash

# Database Setup Script for Indigent Management System (MongoDB)
# This script helps set up the MongoDB database

echo "=========================================="
echo "Indigent Management - MongoDB Setup"
echo "=========================================="
echo ""

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed."
    echo ""
    echo "Please install MongoDB using one of these methods:"
    echo ""
    echo "Option 1: Using Homebrew (recommended for macOS):"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community@7.0"
    echo "  brew services start mongodb-community@7.0"
    echo ""
    echo "Option 2: Download from MongoDB website:"
    echo "  https://www.mongodb.com/try/download/community"
    echo ""
    echo "Option 3: Using MongoDB Atlas (cloud):"
    echo "  https://www.mongodb.com/cloud/atlas/register"
    echo ""
    exit 1
fi

echo "✅ MongoDB is installed"
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running."
    read -p "Do you want to start MongoDB? (y/N): " START_MONGO
    if [[ $START_MONGO =~ ^[Yy]$ ]]; then
        if command -v brew &> /dev/null; then
            brew services start mongodb-community@7.0 || brew services start mongodb-community
        else
            echo "Please start MongoDB manually and run this script again."
            exit 1
        fi
    else
        echo "Please start MongoDB and run this script again."
        exit 1
    fi
fi

echo "✅ MongoDB is running"
echo ""

# Get database connection details
read -p "Enter MongoDB connection string (default: mongodb://localhost:27017): " MONGO_HOST
MONGO_HOST=${MONGO_HOST:-mongodb://localhost:27017}

read -p "Enter database name (default: indigent_management): " DB_NAME
DB_NAME=${DB_NAME:-indigent_management}

# Construct connection string
if [[ "$MONGO_HOST" == *"@"* ]] || [[ "$MONGO_HOST" == *"mongodb+srv"* ]]; then
    # Connection string already includes authentication or is Atlas
    if [[ "$MONGO_HOST" == *"?"* ]]; then
        DATABASE_URL="${MONGO_HOST}&dbName=${DB_NAME}"
    else
        DATABASE_URL="${MONGO_HOST}/${DB_NAME}"
    fi
else
    # Local connection
    DATABASE_URL="${MONGO_HOST}/${DB_NAME}"
fi

echo ""
echo "Database connection: $DATABASE_URL"
echo ""

# Update .env file
echo "Updating .env file with database connection..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example"
    else
        echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
        echo "PORT=3001" >> .env
        echo "NODE_ENV=development" >> .env
        echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
        echo "JWT_EXPIRES_IN=7d" >> .env
        echo "MAX_FILE_SIZE=10485760" >> .env
        echo "UPLOAD_DIR=./uploads" >> .env
        echo "CORS_ORIGIN=http://localhost:3000" >> .env
        echo "DATA_RETENTION_DAYS=2555" >> .env
        echo "AUDIT_LOG_ENABLED=true" >> .env
        echo "Created new .env file"
    fi
fi

# Update DATABASE_URL in .env
if grep -q "DATABASE_URL=" .env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    else
        # Linux
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    fi
else
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

echo "✅ .env file updated"
echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo "1. Generate Prisma client:"
echo "   npm run prisma:generate"
echo ""
echo "2. Push schema to database (MongoDB doesn't use migrations):"
echo "   npx prisma db push"
echo ""
echo "3. Seed the database:"
echo "   npm run prisma:seed"
echo ""
echo "4. Start the server:"
echo "   npm run dev"
echo ""



